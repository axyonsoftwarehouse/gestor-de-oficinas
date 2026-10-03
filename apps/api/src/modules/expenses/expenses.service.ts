import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateExpenseDto } from './dto/create-expense.dto';
import type { QueryExpenseDto } from './dto/query-expense.dto';
import type { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateExpenseDto) {
    return this.prisma.client.expense.create({
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

  async list(query: QueryExpenseDto) {
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
      this.prisma.client.expense.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { expenseDate: 'desc' },
        include: { jobCard: { select: { id: true, number: true } } },
      }),
      this.prisma.client.expense.count({ where }),
      this.prisma.client.expense.aggregate({ where, _sum: { amount: true } }),
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

  async findOne(id: string) {
    const expense = await this.prisma.client.expense.findFirst({ where: { id } });
    if (!expense) throw new NotFoundException('Despesa não encontrada');
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOne(id);
    return this.prisma.client.expense.update({
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

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.expense.delete({ where: { id } });
    return { success: true };
  }
}
