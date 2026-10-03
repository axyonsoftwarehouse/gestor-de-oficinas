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

    const invoiceId = await this.prisma.client.$transaction(async (tx) => {
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
    return this.prisma.client.$transaction(async (tx) => {
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
    return this.prisma.client.$transaction(async (tx) => {
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
}
