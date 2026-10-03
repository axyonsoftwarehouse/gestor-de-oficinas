import { Prisma, QuotationStatus } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../http/errors';
import type { CreateLineItemDto, UpdateLineItemDto } from '../dtos/line-item.dto';
import type { CreateQuotationDto } from '../dtos/create-quotation.dto';
import type { QueryQuotationDto } from '../dtos/query-quotation.dto';
import type { UpdateQuotationDto } from '../dtos/update-quotation.dto';
import { calculateLine } from './line-calculator.service';
import { nextNumber } from './number-sequence.service';

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

export async function createQuotation(dto: CreateQuotationDto, userId: string) {
  const number = await nextNumber('quotation', { prefix: 'OR-', padding: 6 });

  const quotation = await getDb().quotation.create({
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
    const job = await getDb().jobCard.findFirst({
      where: { id: dto.jobCardId },
      include: { lines: { include: { taxes: true } } },
    });
    if (!job) throw new NotFoundError('OS não encontrada');
    for (const line of job.lines) {
      await addQuotationLine(quotation.id, {
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

  return findQuotation(quotation.id);
}

export async function listQuotations(query: QueryQuotationDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.QuotationWhereInput = {};
  if (query.customerId) where.customerId = query.customerId;
  if (query.jobCardId) where.jobCardId = query.jobCardId;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    getDb().quotation.findMany({
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
    getDb().quotation.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findQuotation(id: string) {
  const quotation = await getDb().quotation.findFirst({
    where: { id },
    include: detailInclude,
  });
  if (!quotation) throw new NotFoundError('Orçamento não encontrado');
  return quotation;
}

export async function updateQuotation(id: string, dto: UpdateQuotationDto) {
  await assertQuotation(id);
  await getDb().quotation.update({
    where: { id },
    data: {
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      notes: dto.notes,
    },
  });
  return findQuotation(id);
}

export async function addQuotationLine(quotationId: string, dto: CreateLineItemDto) {
  await assertQuotation(quotationId);

  const amounts = await calculateLine({
    quantity: dto.quantity ?? 1,
    unitPrice: dto.unitPrice ?? 0,
    discountType: dto.discountType ?? null,
    discountValue: dto.discountValue ?? 0,
    taxIds: dto.taxIds,
  });

  const line = await getDb().quotationLine.create({
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

  await recalcQuotationTotals(quotationId);
  return line;
}

export async function updateQuotationLine(
  quotationId: string,
  lineId: string,
  dto: UpdateLineItemDto,
) {
  const existing = await getDb().quotationLine.findFirst({
    where: { id: lineId, quotationId },
    include: { taxes: true },
  });
  if (!existing) throw new NotFoundError('Item do orçamento não encontrado');

  const effectiveTaxIds = dto.taxIds ?? existing.taxes.map((tax) => tax.taxId);
  const amounts = await calculateLine({
    quantity: dto.quantity ?? Number(existing.quantity),
    unitPrice: dto.unitPrice ?? Number(existing.unitPrice),
    discountType: dto.discountType ?? existing.discountType,
    discountValue: dto.discountValue ?? Number(existing.discountValue),
    taxIds: effectiveTaxIds,
  });

  await getDb().quotationLineTax.deleteMany({ where: { lineId } });
  const line = await getDb().quotationLine.update({
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

  await recalcQuotationTotals(quotationId);
  return line;
}

export async function removeQuotationLine(
  quotationId: string,
  lineId: string,
): Promise<{ success: true }> {
  const existing = await getDb().quotationLine.findFirst({
    where: { id: lineId, quotationId },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError('Item do orçamento não encontrado');

  await getDb().quotationLine.delete({ where: { id: lineId } });
  await recalcQuotationTotals(quotationId);
  return { success: true };
}

export function sendQuotation(id: string) {
  return changeQuotationStatus(id, 'SENT', ['DRAFT']);
}

export async function approveQuotation(id: string, userId: string) {
  const quotation = await assertQuotation(id);
  if (!['DRAFT', 'SENT'].includes(quotation.status)) {
    throw new BadRequestError(
      `Não é possível aprovar um orçamento em ${quotation.status}`,
    );
  }
  await getDb().quotation.update({
    where: { id },
    data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() },
  });
  return findQuotation(id);
}

export function rejectQuotation(id: string) {
  return changeQuotationStatus(id, 'REJECTED', ['DRAFT', 'SENT']);
}

export async function removeQuotation(id: string): Promise<{ success: true }> {
  const quotation = await assertQuotation(id);
  if (quotation.status !== 'DRAFT') {
    throw new BadRequestError('Somente orçamentos em rascunho podem ser excluídos');
  }
  await getDb().quotation.delete({ where: { id } });
  return { success: true };
}

export async function convertQuotationToInvoice(id: string, userId: string) {
  const quotation = await findQuotation(id);
  if (quotation.status !== 'APPROVED') {
    throw new BadRequestError('Somente orçamentos aprovados podem ser faturados');
  }
  if (quotation.invoices.length > 0) {
    throw new ConflictError('Orçamento já convertido em fatura');
  }

  const number = await nextNumber('invoice', { prefix: 'FT-', padding: 6 });

  const invoice = await getDb().invoice.create({
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
    await getDb().invoiceLine.create({
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

  await getDb().quotation.update({
    where: { id },
    data: { status: 'CONVERTED' },
  });

  return getDb().invoice.findUnique({
    where: { id: invoice.id },
    include: invoiceDetailInclude,
  });
}

async function changeQuotationStatus(
  id: string,
  status: QuotationStatus,
  allowedFrom: QuotationStatus[],
) {
  const quotation = await assertQuotation(id);
  if (!allowedFrom.includes(quotation.status)) {
    throw new BadRequestError(
      `Não é possível mudar de ${quotation.status} para ${status}`,
    );
  }
  await getDb().quotation.update({ where: { id }, data: { status } });
  return findQuotation(id);
}

async function assertQuotation(id: string) {
  const quotation = await getDb().quotation.findFirst({ where: { id } });
  if (!quotation) throw new NotFoundError('Orçamento não encontrado');
  return quotation;
}

async function recalcQuotationTotals(quotationId: string): Promise<void> {
  const lines = await getDb().quotationLine.findMany({
    where: { quotationId },
    select: { quantity: true, unitPrice: true, taxBase: true, taxAmount: true },
  });

  let subtotal = new Prisma.Decimal(0);
  let taxTotal = new Prisma.Decimal(0);
  let discountTotal = new Prisma.Decimal(0);

  for (const line of lines) {
    subtotal = subtotal.plus(line.taxBase);
    taxTotal = taxTotal.plus(line.taxAmount);
    discountTotal = discountTotal.plus(
      line.quantity.mul(line.unitPrice).minus(line.taxBase),
    );
  }

  await getDb().quotation.update({
    where: { id: quotationId },
    data: { subtotal, taxTotal, discountTotal, total: subtotal.plus(taxTotal) },
  });
}
