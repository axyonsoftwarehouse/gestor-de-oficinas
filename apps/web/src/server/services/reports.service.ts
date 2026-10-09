import { Prisma } from '@prisma/client';
import { getDb } from '../db/prisma';
import type { QueryReportDto } from '../dtos/query-report.dto';

export async function financialReport(query: QueryReportDto) {
  const range = dateRange(query.from, query.to);

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    deletedAt: null,
    status: { in: ['ISSUED', 'PARTIALLY_PAID', 'PAID'] },
  };
  if (query.branchId) invoiceWhere.branchId = query.branchId;
  if (range) invoiceWhere.issueDate = range;

  const paymentWhere: Prisma.PaymentWhereInput = {};
  if (query.branchId) paymentWhere.invoice = { branchId: query.branchId };
  if (range) paymentWhere.paidAt = range;

  const expenseWhere: Prisma.ExpenseWhereInput = {};
  if (query.branchId) expenseWhere.branchId = query.branchId;
  if (range) expenseWhere.expenseDate = range;

  const [invoiced, received, expenses] = await Promise.all([
    getDb().invoice.aggregate({
      where: invoiceWhere,
      _sum: { total: true },
      _count: { _all: true },
    }),
    getDb().payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    getDb().expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const receivedTotal = received._sum.amount ?? new Prisma.Decimal(0);
  const expensesTotal = expenses._sum.amount ?? new Prisma.Decimal(0);

  return {
    period: { from: query.from ?? null, to: query.to ?? null },
    invoiced: {
      total: invoiced._sum.total ?? new Prisma.Decimal(0),
      count: invoiced._count._all,
    },
    received: { total: receivedTotal, count: received._count._all },
    expenses: { total: expensesTotal, count: expenses._count._all },
    net: receivedTotal.minus(expensesTotal),
  };
}

export async function stockReport() {
  const balances = await getDb().stockBalance.findMany({
    include: {
      part: {
        select: {
          id: true,
          name: true,
          sku: true,
          costPrice: true,
          salePrice: true,
          minStock: true,
        },
      },
      location: { select: { id: true, name: true } },
    },
  });

  let costValue = new Prisma.Decimal(0);
  let saleValue = new Prisma.Decimal(0);
  const lowStock: typeof balances = [];

  for (const balance of balances) {
    costValue = costValue.plus(balance.quantity.mul(balance.part.costPrice));
    saleValue = saleValue.plus(balance.quantity.mul(balance.part.salePrice));
    if (balance.quantity.lte(balance.part.minStock)) lowStock.push(balance);
  }

  return {
    itemsCount: balances.length,
    costValue,
    saleValue,
    lowStockCount: lowStock.length,
    lowStock,
  };
}

export async function jobCardsReport() {
  const where: Prisma.JobCardWhereInput = { deletedAt: null };

  const [byStatus, byType, total] = await Promise.all([
    getDb().jobCard.groupBy({ by: ['status'], where, _count: { _all: true } }),
    getDb().jobCard.groupBy({ by: ['type'], where, _count: { _all: true } }),
    getDb().jobCard.count({ where }),
  ]);

  return { total, byStatus, byType };
}

function dateRange(
  from?: string,
  to?: string,
): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
}
