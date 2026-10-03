import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { QueryReportDto } from './dto/query-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async financial(query: QueryReportDto) {
    const range = this.range(query.from, query.to);

    const invoiceWhere: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      status: { in: ['ISSUED', 'PARTIALLY_PAID', 'PAID'] },
    };
    if (query.branchId) invoiceWhere.branchId = query.branchId;
    if (range) invoiceWhere.issueDate = range;

    const paymentWhere: Prisma.PaymentWhereInput = {};
    if (range) paymentWhere.paidAt = range;

    const expenseWhere: Prisma.ExpenseWhereInput = {};
    if (query.branchId) expenseWhere.branchId = query.branchId;
    if (range) expenseWhere.expenseDate = range;

    const [invoiced, received, expenses] = await Promise.all([
      this.prisma.client.invoice.aggregate({
        where: invoiceWhere,
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.client.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.client.expense.aggregate({
        where: expenseWhere,
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const receivedTotal = received._sum.amount ?? new Prisma.Decimal(0);
    const expensesTotal = expenses._sum.amount ?? new Prisma.Decimal(0);

    return {
      period: { from: query.from ?? null, to: query.to ?? null },
      invoiced: { total: invoiced._sum.total ?? new Prisma.Decimal(0), count: invoiced._count._all },
      received: { total: receivedTotal, count: received._count._all },
      expenses: { total: expensesTotal, count: expenses._count._all },
      net: receivedTotal.minus(expensesTotal),
    };
  }

  async stock() {
    const balances = await this.prisma.client.stockBalance.findMany({
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

  async jobCards() {
    const where: Prisma.JobCardWhereInput = { deletedAt: null };

    const [byStatus, byType, total] = await Promise.all([
      this.prisma.client.jobCard.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.client.jobCard.groupBy({ by: ['type'], where, _count: { _all: true } }),
      this.prisma.client.jobCard.count({ where }),
    ]);

    return { total, byStatus, byType };
  }

  private range(
    from?: string,
    to?: string,
  ): { gte?: Date; lte?: Date } | undefined {
    if (!from && !to) return undefined;
    return {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
}
