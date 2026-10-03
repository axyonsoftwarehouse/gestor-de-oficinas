import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, QuotationStatus } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import { LineCalculatorService } from '../../common/services/line-calculator.service';
import { NumberSequenceService } from '../../common/services/number-sequence.service';
import type { CreateLineItemDto, UpdateLineItemDto } from '../../common/dto/line-item.dto';
import type { CreateQuotationDto } from './dto/create-quotation.dto';
import type { QueryQuotationDto } from './dto/query-quotation.dto';
import type { UpdateQuotationDto } from './dto/update-quotation.dto';

const detailInclude = {
  customer: { select: { id: true, name: true } },
  jobCard: { select: { id: true, number: true } },
  lines: {
    orderBy: { sequence: 'asc' as const },
    include: { service: true, part: true, unit: true, taxes: true },
  },
  invoices: { select: { id: true, number: true, status: true } },
} satisfies Prisma.QuotationInclude;

const invoiceDetailInclude = {
  customer: { select: { id: true, name: true } },
  jobCard: { select: { id: true, number: true } },
  quotation: { select: { id: true, number: true } },
  lines: {
    orderBy: { sequence: 'asc' as const },
    include: { service: true, part: true, unit: true, taxes: true },
  },
  payments: { orderBy: { paidAt: 'asc' as const } },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lineCalculator: LineCalculatorService,
    private readonly numberSequence: NumberSequenceService,
  ) {}

  async create(dto: CreateQuotationDto, userId: string) {
    const number = await this.numberSequence.next('quotation', {
      prefix: 'OR-',
      padding: 6,
    });

    const quotation = await this.prisma.client.quotation.create({
      data: {
        tenantId: requireTenantId(),
        branchId: dto.branchId,
        customerId: dto.customerId,
        jobCardId: dto.jobCardId,
        number,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        createdById: userId,
      },
    });

    if (dto.copyFromJobCard && dto.jobCardId) {
      const job = await this.prisma.client.jobCard.findFirst({
        where: { id: dto.jobCardId },
        include: { lines: { include: { taxes: true } } },
      });
      if (!job) throw new NotFoundException('OS não encontrada');
      for (const line of job.lines) {
        await this.addLine(quotation.id, {
          type: line.type,
          serviceId: line.serviceId ?? undefined,
          partId: line.partId ?? undefined,
          description: line.description ?? undefined,
          quantity: Number(line.quantity),
          unitId: line.unitId ?? undefined,
          unitPrice: Number(line.unitPrice),
          discountType: line.discountType ?? undefined,
          discountValue: Number(line.discountValue),
          taxIds: line.taxes.map((tax) => tax.taxId),
          sequence: line.sequence,
        });
      }
    }

    return this.findOne(quotation.id);
  }

  async list(query: QueryQuotationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.QuotationWhereInput = {};
    if (query.customerId) where.customerId = query.customerId;
    if (query.jobCardId) where.jobCardId = query.jobCardId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.client.quotation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          jobCard: { select: { id: true, number: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.client.quotation.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const quotation = await this.prisma.client.quotation.findFirst({
      where: { id },
      include: detailInclude,
    });
    if (!quotation) throw new NotFoundException('Orçamento não encontrado');
    return quotation;
  }

  async update(id: string, dto: UpdateQuotationDto) {
    await this.assertQuotation(id);
    await this.prisma.client.quotation.update({
      where: { id },
      data: {
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
      },
    });
    return this.findOne(id);
  }

  async addLine(quotationId: string, dto: CreateLineItemDto) {
    await this.assertQuotation(quotationId);

    const amounts = await this.lineCalculator.calculate({
      quantity: dto.quantity ?? 1,
      unitPrice: dto.unitPrice ?? 0,
      discountType: dto.discountType ?? null,
      discountValue: dto.discountValue ?? 0,
      taxIds: dto.taxIds,
    });

    const line = await this.prisma.client.quotationLine.create({
      data: {
        quotationId,
        type: dto.type,
        serviceId: dto.serviceId,
        partId: dto.partId,
        description: dto.description,
        quantity: amounts.quantity,
        unitId: dto.unitId,
        unitPrice: amounts.unitPrice,
        discountType: dto.discountType,
        discountValue: amounts.discountValue,
        taxBase: amounts.base,
        taxAmount: amounts.taxAmount,
        total: amounts.total,
        sequence: dto.sequence ?? 0,
        taxes: { create: amounts.taxRows },
      },
      include: { taxes: true },
    });

    await this.recalcTotals(quotationId);
    return line;
  }

  async updateLine(quotationId: string, lineId: string, dto: UpdateLineItemDto) {
    const existing = await this.prisma.client.quotationLine.findFirst({
      where: { id: lineId, quotationId },
      include: { taxes: true },
    });
    if (!existing) throw new NotFoundException('Item do orçamento não encontrado');

    const effectiveTaxIds = dto.taxIds ?? existing.taxes.map((tax) => tax.taxId);
    const amounts = await this.lineCalculator.calculate({
      quantity: dto.quantity ?? Number(existing.quantity),
      unitPrice: dto.unitPrice ?? Number(existing.unitPrice),
      discountType: dto.discountType ?? existing.discountType,
      discountValue: dto.discountValue ?? Number(existing.discountValue),
      taxIds: effectiveTaxIds,
    });

    const line = await this.prisma.runInTransaction(async (tx) => {
      await tx.quotationLineTax.deleteMany({ where: { lineId } });
      return tx.quotationLine.update({
        where: { id: lineId },
        data: {
          type: dto.type,
          serviceId: dto.serviceId,
          partId: dto.partId,
          description: dto.description,
          quantity: amounts.quantity,
          unitId: dto.unitId,
          unitPrice: amounts.unitPrice,
          discountType: dto.discountType,
          discountValue: amounts.discountValue,
          taxBase: amounts.base,
          taxAmount: amounts.taxAmount,
          total: amounts.total,
          taxes: { create: amounts.taxRows },
        },
        include: { taxes: true },
      });
    });

    await this.recalcTotals(quotationId);
    return line;
  }

  async removeLine(quotationId: string, lineId: string) {
    const existing = await this.prisma.client.quotationLine.findFirst({
      where: { id: lineId, quotationId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Item do orçamento não encontrado');

    await this.prisma.client.quotationLine.delete({ where: { id: lineId } });
    await this.recalcTotals(quotationId);
    return { success: true };
  }

  async send(id: string) {
    return this.changeStatus(id, 'SENT', ['DRAFT']);
  }

  async approve(id: string, userId: string) {
    const quotation = await this.assertQuotation(id);
    if (!['DRAFT', 'SENT'].includes(quotation.status)) {
      throw new BadRequestException(
        `Não é possível aprovar um orçamento em ${quotation.status}`,
      );
    }
    await this.prisma.client.quotation.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() },
    });
    return this.findOne(id);
  }

  async reject(id: string) {
    return this.changeStatus(id, 'REJECTED', ['DRAFT', 'SENT']);
  }

  async remove(id: string) {
    const quotation = await this.assertQuotation(id);
    if (quotation.status !== 'DRAFT') {
      throw new BadRequestException('Somente orçamentos em rascunho podem ser excluídos');
    }
    await this.prisma.client.quotation.delete({ where: { id } });
    return { success: true };
  }

  async convertToInvoice(id: string, userId: string) {
    const quotation = await this.findOne(id);
    if (quotation.status !== 'APPROVED') {
      throw new BadRequestException('Somente orçamentos aprovados podem ser faturados');
    }
    if (quotation.invoices.length > 0) {
      throw new ConflictException('Orçamento já convertido em fatura');
    }

    const number = await this.numberSequence.next('invoice', {
      prefix: 'FT-',
      padding: 6,
    });

    const invoiceId = await this.prisma.runInTransaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          tenantId: requireTenantId(),
          branchId: quotation.branchId,
          jobCardId: quotation.jobCardId ?? undefined,
          quotationId: quotation.id,
          customerId: quotation.customerId,
          number,
          status: 'ISSUED',
          issueDate: new Date(),
          subtotal: quotation.subtotal,
          discountTotal: quotation.discountTotal,
          taxTotal: quotation.taxTotal,
          total: quotation.total,
          currency: quotation.currency,
          createdById: userId,
        },
      });

      for (const line of quotation.lines) {
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
            quotationLineId: line.id,
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

      await tx.quotation.update({
        where: { id },
        data: { status: 'CONVERTED' },
      });

      return invoice.id;
    });

    return this.prisma.client.invoice.findUnique({
      where: { id: invoiceId },
      include: invoiceDetailInclude,
    });
  }

  private async changeStatus(
    id: string,
    status: QuotationStatus,
    allowedFrom: QuotationStatus[],
  ) {
    const quotation = await this.assertQuotation(id);
    if (!allowedFrom.includes(quotation.status)) {
      throw new BadRequestException(
        `Não é possível mudar de ${quotation.status} para ${status}`,
      );
    }
    await this.prisma.client.quotation.update({ where: { id }, data: { status } });
    return this.findOne(id);
  }

  private async assertQuotation(id: string) {
    const quotation = await this.prisma.client.quotation.findFirst({ where: { id } });
    if (!quotation) throw new NotFoundException('Orçamento não encontrado');
    return quotation;
  }

  private async recalcTotals(quotationId: string): Promise<void> {
    const lines = await this.prisma.client.quotationLine.findMany({
      where: { quotationId },
      select: { quantity: true, unitPrice: true, taxBase: true, taxAmount: true },
    });

    let subtotal = new Prisma.Decimal(0);
    let taxTotal = new Prisma.Decimal(0);
    let discountTotal = new Prisma.Decimal(0);

    for (const line of lines) {
      subtotal = subtotal.plus(line.taxBase);
      taxTotal = taxTotal.plus(line.taxAmount);
      discountTotal = discountTotal.plus(line.quantity.mul(line.unitPrice).minus(line.taxBase));
    }

    await this.prisma.client.quotation.update({
      where: { id: quotationId },
      data: { subtotal, taxTotal, discountTotal, total: subtotal.plus(taxTotal) },
    });
  }
}
