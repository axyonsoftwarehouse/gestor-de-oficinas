import { getDb } from '../db/prisma';
import { BadRequestError } from '../http/errors';

/**
 * Garante que uma referência pertence ao tenant corrente.
 * Como `getDb()` roda sob RLS, um id de outro tenant não é encontrado.
 */
async function ensure(found: unknown, label: string): Promise<void> {
  if (!found) throw new BadRequestError(`${label} inválido`);
}

export async function assertServiceRef(id?: string): Promise<void> {
  if (!id) return;
  await ensure(
    await getDb().serviceCatalog.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    }),
    'Serviço',
  );
}

export async function assertPartRef(id?: string): Promise<void> {
  if (!id) return;
  await ensure(
    await getDb().partCatalog.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    }),
    'Peça',
  );
}

export async function assertUnitRef(id?: string): Promise<void> {
  if (!id) return;
  await ensure(
    await getDb().unit.findFirst({ where: { id }, select: { id: true } }),
    'Unidade',
  );
}

export async function assertCustomerRef(id?: string): Promise<void> {
  if (!id) return;
  await ensure(
    await getDb().customer.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    }),
    'Cliente',
  );
}

export async function assertVehicleRef(id?: string): Promise<void> {
  if (!id) return;
  await ensure(
    await getDb().vehicle.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    }),
    'Veículo',
  );
}

export async function assertLineRefs(refs: {
  serviceId?: string;
  partId?: string;
  unitId?: string;
}): Promise<void> {
  await Promise.all([
    assertServiceRef(refs.serviceId),
    assertPartRef(refs.partId),
    assertUnitRef(refs.unitId),
  ]);
}
