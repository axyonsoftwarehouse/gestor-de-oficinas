import { Prisma, requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { NotFoundError } from '../http/errors';
import type { CreateExpenseDto } from '../dtos/create-expense.dto';
import type { QueryExpenseDto } from '../dtos/query-expense.dto';
import type { UpdateExpenseDto } from '../dtos/update-expense.dto';

export function createExpense(dto: CreateExpenseDto) {
  return getDb().expense.create({
    data: {
      tenantId: requireTenantId(),
      branchId: dto.branchId,
      jobCardId: dto.jobCardId,
      category: dto.category,
      description: dto.description,
      amount: dto.amount,
      expenseDate: new Date(dto.expenseDate),
    },
  });
}

export async function listExpenses(query: QueryExpenseDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.ExpenseWhereInput = {};
  if (query.branchId) where.branchId = query.branchId;
  if (query.category) where.category = query.category;
  if (query.from || query.to) {
    where.expenseDate = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  const [items, total, aggregate] = await Promise.all([
    getDb().expense.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { expenseDate: 'desc' },
      include: { jobCard: { select: { id: true, number: true } } },
    }),
    getDb().expense.count({ where }),
    getDb().expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return {
    items,
    total,
    sum: aggregate._sum.amount ?? new Prisma.Decimal(0),
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function findExpense(id: string) {
  const expense = await getDb().expense.findFirst({ where: { id } });
  if (!expense) throw new NotFoundError('Despesa não encontrada');
  return expense;
}

export async function updateExpense(id: string, dto: UpdateExpenseDto) {
  await findExpense(id);
  return getDb().expense.update({
    where: { id },
    data: {
      branchId: dto.branchId,
      jobCardId: dto.jobCardId,
      category: dto.category,
      description: dto.description,
      amount: dto.amount,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
    },
  });
}

export async function removeExpense(id: string): Promise<{ success: true }> {
  await findExpense(id);
  await getDb().expense.delete({ where: { id } });
  return { success: true };
}
