import { Prisma, requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { NotFoundError } from '../http/errors';
import type { CreatePartDto } from '../dtos/create-part.dto';
import type { QueryPartDto } from '../dtos/query-part.dto';
import type { UpdatePartDto } from '../dtos/update-part.dto';

export function createPart(dto: CreatePartDto) {
  return getDb().partCatalog.create({
    data: { ...dto, tenantId: requireTenantId() },
  });
}

export async function listParts(query: QueryPartDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.PartCatalogWhereInput = { deletedAt: null };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    getDb().partCatalog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      include: { category: { select: { id: true, name: true } }, unit: true },
    }),
    getDb().partCatalog.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findPart(id: string) {
  const part = await getDb().partCatalog.findFirst({
    where: { id, deletedAt: null },
    include: { category: true, unit: true },
  });
  if (!part) throw new NotFoundError('Peça não encontrada');
  return part;
}

export async function updatePart(id: string, dto: UpdatePartDto) {
  await findPart(id);
  return getDb().partCatalog.update({ where: { id }, data: dto });
}

export async function removePart(id: string): Promise<{ success: true }> {
  await findPart(id);
  await getDb().partCatalog.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}
