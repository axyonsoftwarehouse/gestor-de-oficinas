import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import { NumberSequenceService } from '../../common/services/number-sequence.service';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import type { QueryInvoiceDto } from './dto/query-invoice.dto';
import type { UpdateInvoiceDto } from './dto/update-invoice.dto';

const detailInclude = {
  customer: { select: { id: true, name: true } },
  jobCard: { select: { id: true, number: true } },
  quotation: { select: { id: true, number: true } },
  lines: {
    orderBy: { sequence: 'asc' as const },
    include: { service: true, part: true, unit: true, taxes: true },
  },
  payments: {
    orderBy: { paidAt: 'asc' as const },
    include: { method: true },
  },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequence: NumberSequenceService,
  ) {}

  async list(query: QueryInvoiceDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.InvoiceWhereInput = { deletedAt: null };
    if (query.customerId) where.customerId = query.customerId;
    if (query.jobCardId) where.jobCardId = query.jobCardId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.client.invoice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          jobCard: { select: { id: true, number: true } },
          _count: { select: { lines: true, payments: true } },
        },
      }),
      this.prisma.client.invoice.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.client.invoice.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    await this.assertInvoice(id);
    await this.prisma.client.invoice.update({
      where: { id },
      data: {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
      },
    });
    return this.findOne(id);
  }

  async issue(id: string) {
    const invoice = await this.assertInvoice(id);
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Somente faturas em rascunho podem ser emitidas');
    }
    await this.prisma.client.invoice.update({
      where: { id },
      data: { status: 'ISSUED', issueDate: new Date() },
    });
    return this.findOne(id);
  }

  async cancel(id: string) {
    const invoice = await this.assertInvoice(id);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Fatura paga não pode ser cancelada');
    }
    await this.prisma.client.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return this.findOne(id);
  }

  /** Cria uma fatura a partir dos itens de uma OS. */
  async createFromJobCard(jobCardId: string, userId: string) {
    const job = await this.prisma.client.jobCard.findFirst({
      where: { id: jobCardId, deletedAt: null },
      include: { lines: { include: { taxes: true } } },
    });
    if (!job) throw new NotFoundException('OS não encontrada');

    const number = await this.numberSequence.next('invoice', {
      prefix: 'FT-',
      padding: 6,
    });

    const discountValue = new Prisma.Decimal(job.discountValue);
    const discountTotal =
      job.discountType === 'PERCENT'
        ? job.subtotal.mul(discountValue).div(100)
        : job.discountType === 'AMOUNT'
          ? discountValue
          : new Prisma.Decimal(0);

    const invoiceId = await this.prisma.runInTransaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          tenantId: requireTenantId(),
          branchId: job.branchId,
          jobCardId: job.id,
          customerId: job.customerId,
          number,
          status: 'ISSUED',
          issueDate: new Date(),
          subtotal: job.subtotal,
          discountTotal,
          taxTotal: job.taxTotal,
          total: job.total,
          currency: job.currency,
          createdById: userId,
        },
      });

      for (const line of job.lines) {
        await tx.invoiceLine.create({
          data: {
            invoiceId: invoice.id,
            type: line.type,
            serviceId: line.serviceId ?? undefined,
            partId: line.partId ?? undefined,
            description: line.description ?? undefined,
            quantity: line.quantity,
            unitId: line.unitId ?? undefined,
            unitPrice: line.unitPrice,
            discountType: line.discountType ?? undefined,
            discountValue: line.discountValue,
            taxBase: line.taxBase,
            taxAmount: line.taxAmount,
            total: line.total,
            jobLineId: line.id,
            sequence: line.sequence,
            taxes: {
              create: line.taxes.map((tax) => ({
                taxId: tax.taxId,
                rate: tax.rate,
                base: tax.base,
                amount: tax.amount,
              })),
            },
          },
        });
      }

      return invoice.id;
    });

    return this.findOne(invoiceId);
  }

  async addPayment(invoiceId: string, dto: CreatePaymentDto, userId: string) {
    return this.prisma.runInTransaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Fatura não encontrada');
      if (invoice.status === 'CANCELLED') {
        throw new BadRequestException('Fatura cancelada');
      }

      await tx.payment.create({
        data: {
          tenantId: requireTenantId(),
          invoiceId,
          amount: dto.amount,
          methodId: dto.methodId,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
          reference: dto.reference,
          notes: dto.notes,
          receivedById: userId,
        },
      });

      const aggregate = await tx.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });
      const amountPaid = aggregate._sum.amount ?? new Prisma.Decimal(0);
      const status = this.resolveStatus(invoice.total, amountPaid, invoice.status);

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid, status },
      });

      return tx.invoice.findUnique({ where: { id: invoiceId }, include: detailInclude });
    });
  }

  async removePayment(invoiceId: string, paymentId: string) {
    return this.prisma.runInTransaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Fatura não encontrada');

      const payment = await tx.payment.findFirst({ where: { id: paymentId, invoiceId } });
      if (!payment) throw new NotFoundException('Pagamento não encontrado');

      await tx.payment.delete({ where: { id: paymentId } });

      const aggregate = await tx.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });
      const amountPaid = aggregate._sum.amount ?? new Prisma.Decimal(0);
      const status = this.resolveStatus(invoice.total, amountPaid, invoice.status);

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid, status },
      });

      return tx.invoice.findUnique({ where: { id: invoiceId }, include: detailInclude });
    });
  }

  private resolveStatus(
    total: Prisma.Decimal,
    amountPaid: Prisma.Decimal,
    current: string,
  ) {
    if (current === 'CANCELLED') return 'CANCELLED';
    if (amountPaid.gte(total) && total.gt(0)) return 'PAID';
    if (amountPaid.gt(0)) return 'PARTIALLY_PAID';
    return current === 'DRAFT' ? 'DRAFT' : 'ISSUED';
  }

  private async assertInvoice(id: string) {
    const invoice = await this.prisma.client.invoice.findFirst({
      where: { id, deletedAt: null },
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    return invoice;
  }

  /** Renderiza a fatura em HTML (consumível por um serviço headless de PDF). */
  async renderDocument(id: string): Promise<string> {
    const invoice = await this.findOne(id);
    const currency = invoice.currency || 'BRL';
    const money = (value: unknown): string =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(value));

    const lineRows = invoice.lines
      .map(
        (line) =>
          `<tr><td>${this.escape(line.description ?? line.type)}</td><td class="num">${line.quantity}</td><td class="num">${money(line.unitPrice)}</td><td class="num">${money(line.total)}</td></tr>`,
      )
      .join('');

    const paymentRows = invoice.payments
      .map(
        (payment) =>
          `<tr><td>${payment.paidAt.toISOString().slice(0, 10)}</td><td>${this.escape(payment.reference ?? '-')}</td><td class="num">${money(payment.amount)}</td></tr>`,
      )
      .join('');

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Fatura ${this.escape(invoice.number)}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
  h1 { font-size: 20px; margin: 0; }
  .muted { color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 13px; }
  .num { text-align: right; }
  .totals { margin-top: 16px; width: 280px; margin-left: auto; }
  .totals td { border: none; }
</style>
</head>
<body>
  <h1>Fatura ${this.escape(invoice.number)}</h1>
  <p class="muted">Cliente: ${this.escape(invoice.customer?.name ?? '')} &middot; Emitida em ${invoice.issueDate.toISOString().slice(0, 10)}</p>
  <table>
    <thead><tr><th>Descrição</th><th class="num">Qtd</th><th class="num">Unitário</th><th class="num">Total</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>
  <table class="totals">
    <tr><td>Subtotal</td><td class="num">${money(invoice.subtotal)}</td></tr>
    <tr><td>Descontos</td><td class="num">- ${money(invoice.discountTotal)}</td></tr>
    <tr><td>Impostos</td><td class="num">${money(invoice.taxTotal)}</td></tr>
    <tr><td><strong>Total</strong></td><td class="num"><strong>${money(invoice.total)}</strong></td></tr>
    <tr><td>Pago</td><td class="num">${money(invoice.amountPaid)}</td></tr>
  </table>
  ${paymentRows ? `<h2 style="font-size:14px;margin-top:24px">Pagamentos</h2><table><thead><tr><th>Data</th><th>Referência</th><th class="num">Valor</th></tr></thead><tbody>${paymentRows}</tbody></table>` : ''}
</body>
</html>`;
  }

  private escape(value: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    };
    return value.replace(/[&<>"]/g, (char) => map[char] ?? char);
  }
}
