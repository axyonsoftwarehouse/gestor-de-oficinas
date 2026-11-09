import { requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { BadRequestError } from '../http/errors';

export function listBrands() {
  return getDb().vehicleBrand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, _count: { select: { models: true } } },
  });
}

export function listModels(brandId?: string) {
  return getDb().vehicleModel.findMany({
    where: { isActive: true, ...(brandId ? { brandId } : {}) },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, brandId: true },
  });
}

/** Cria (ou reaproveita, sem diferenciar maiúsculas) uma marca da oficina. */
export async function createBrand(name: string) {
  const trimmed = name.trim();
  const existing = await getDb().vehicleBrand.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  return getDb().vehicleBrand.create({
    data: { tenantId: requireTenantId(), name: trimmed },
    select: { id: true, name: true },
  });
}

/** Cria (ou reaproveita) um modelo vinculado a uma marca da oficina. */
export async function createModel(brandId: string, name: string) {
  const brand = await getDb().vehicleBrand.findFirst({
    where: { id: brandId, isActive: true },
    select: { id: true },
  });
  if (!brand) throw new BadRequestError('Marca inválida');

  const trimmed = name.trim();
  const existing = await getDb().vehicleModel.findFirst({
    where: { brandId, name: { equals: trimmed, mode: 'insensitive' } },
    select: { id: true, name: true, brandId: true },
  });
  if (existing) return existing;

  return getDb().vehicleModel.create({
    data: { tenantId: requireTenantId(), brandId, name: trimmed },
    select: { id: true, name: true, brandId: true },
  });
}
