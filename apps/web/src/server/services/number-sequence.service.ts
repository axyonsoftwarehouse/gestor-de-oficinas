import { requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';

export interface NumberSequenceOptions {
  prefix?: string;
  padding?: number;
}

/** Numeração transacional de documentos (OS, orçamento, fatura). */
export async function nextNumber(
  entity: string,
  options: NumberSequenceOptions = {},
): Promise<string> {
  const tenantId = requireTenantId();
  const prefix = options.prefix ?? '';
  const padding = options.padding ?? 6;

  const sequence = await getDb().numberSequence.upsert({
    where: { tenantId_entity: { tenantId, entity } },
    create: { tenantId, entity, prefix, padding, nextValue: 2 },
    update: { nextValue: { increment: 1 } },
  });

  const value = sequence.nextValue - 1;
  return `${prefix}${String(value).padStart(padding, '0')}`;
}
