import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  createPrismaClient,
  createSystemPrismaClient,
  type DatabaseClient,
} from '@gestor/database';
import { prismaContext } from './prisma-context';

/**
 * `base`   — client com extensão de escopo de tenant (ponto de partida).
 * `system` — client sem extensão (auth/plataforma). Ambos usam o papel de
 *            aplicação (APP_DATABASE_URL), sujeito à RLS.
 * `client` — client atual: a transação da requisição (se houver) ou `base`.
 *
 * `runInTransaction` reaproveita a transação da requisição; caso não exista,
 * abre uma nova. Assim os serviços não aninham transações.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly base: DatabaseClient = createPrismaClient();
  readonly system = createSystemPrismaClient();

  get client(): DatabaseClient {
    const tx = prismaContext.getStore();
    return (tx as DatabaseClient | undefined) ?? this.base;
  }

  async runInTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const existing = prismaContext.getStore();
    if (existing) {
      return fn(existing as Prisma.TransactionClient);
    }
    return this.base.$transaction(
      (tx) => prismaContext.run(tx, () => fn(tx as unknown as Prisma.TransactionClient)),
      { timeout: 30000, maxWait: 10000 },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.base.$disconnect(), this.system.$disconnect()]);
  }
}
