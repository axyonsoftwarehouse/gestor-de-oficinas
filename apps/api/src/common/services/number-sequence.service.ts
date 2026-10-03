import { Injectable } from '@nestjs/common';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';

export interface NumberSequenceOptions {
  prefix?: string;
  padding?: number;
}

/**
 * Numeração transacional de documentos (job card, orçamento, fatura).
 * Usa upsert incremental dentro de uma transação para evitar colisões.
 */
@Injectable()
export class NumberSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async next(entity: string, options: NumberSequenceOptions = {}): Promise<string> {
    const tenantId = requireTenantId();
    const prefix = options.prefix ?? '';
    const padding = options.padding ?? 6;

    const sequence = await this.prisma.runInTransaction((tx) =>
      tx.numberSequence.upsert({
        where: { tenantId_entity: { tenantId, entity } },
        create: { tenantId, entity, prefix, padding, nextValue: 2 },
        update: { nextValue: { increment: 1 } },
      }),
    );

    const value = sequence.nextValue - 1;
    return `${prefix}${String(value).padStart(padding, '0')}`;
  }
}
