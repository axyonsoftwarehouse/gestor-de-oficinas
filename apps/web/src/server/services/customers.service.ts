import { Prisma, requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { NotFoundError } from '../http/errors';
import type { CreateCustomerDto } from '../dtos/create-customer.dto';
import type { QueryCustomerDto } from '../dtos/query-customer.dto';
import type { UpdateCustomerDto } from '../dtos/update-customer.dto';

export function createCustomer(dto: CreateCustomerDto) {
  return getDb().customer.create({
    data: { ...dto, tenantId: requireTenantId() },
  });
}

export async function listCustomers(query: QueryCustomerDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { document: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    getDb().customer.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    getDb().customer.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findCustomer(id: string) {
  const customer = await getDb().customer.findFirst({
    where: { id, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Cliente não encontrado');
  return customer;
}

export async function updateCustomer(id: string, dto: UpdateCustomerDto) {
  await findCustomer(id);
  return getDb().customer.update({ where: { id }, data: dto });
}

export async function removeCustomer(id: string): Promise<{ success: true }> {
  await findCustomer(id);
  await getDb().customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}
