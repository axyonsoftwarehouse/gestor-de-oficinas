import { Prisma, requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { NotFoundError } from '../http/errors';
import type { CreateSupplierDto } from '../dtos/create-supplier.dto';
import type { QuerySupplierDto } from '../dtos/query-supplier.dto';
import type { UpdateSupplierDto } from '../dtos/update-supplier.dto';

export function createSupplier(dto: CreateSupplierDto) {
  return getDb().supplier.create({
    data: { ...dto, tenantId: requireTenantId() },
  });
}

export async function listSuppliers(query: QuerySupplierDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.SupplierWhereInput = { isActive: true };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { document: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    getDb().supplier.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
    }),
    getDb().supplier.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findSupplier(id: string) {
  const supplier = await getDb().supplier.findFirst({
    where: { id, isActive: true },
  });
  if (!supplier) throw new NotFoundError('Fornecedor não encontrado');
  return supplier;
}

export async function updateSupplier(id: string, dto: UpdateSupplierDto) {
  await findSupplier(id);
  return getDb().supplier.update({ where: { id }, data: dto });
}

export async function removeSupplier(id: string): Promise<{ success: true }> {
  await findSupplier(id);
  await getDb().supplier.update({
    where: { id },
    data: { isActive: false },
  });
  return { success: true };
}
