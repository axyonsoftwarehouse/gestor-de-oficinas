import { Prisma, requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { NotFoundError } from '../http/errors';
import type { CreateServiceDto } from '../dtos/create-service.dto';
import type { QueryServiceDto } from '../dtos/query-service.dto';
import type { UpdateServiceDto } from '../dtos/update-service.dto';

export function createService(dto: CreateServiceDto) {
  return getDb().serviceCatalog.create({
    data: { ...dto, tenantId: requireTenantId() },
  });
}

export async function listServices(query: QueryServiceDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.ServiceCatalogWhereInput = { deletedAt: null };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    getDb().serviceCatalog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
    }),
    getDb().serviceCatalog.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findService(id: string) {
  const service = await getDb().serviceCatalog.findFirst({
    where: { id, deletedAt: null },
  });
  if (!service) throw new NotFoundError('Serviço não encontrado');
  return service;
}

export async function updateService(id: string, dto: UpdateServiceDto) {
  await findService(id);
  return getDb().serviceCatalog.update({ where: { id }, data: dto });
}

export async function removeService(id: string): Promise<{ success: true }> {
  await findService(id);
  await getDb().serviceCatalog.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}
