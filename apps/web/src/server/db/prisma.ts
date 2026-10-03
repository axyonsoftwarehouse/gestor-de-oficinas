import {
  createPrismaClient,
  createSystemPrismaClient,
  type DatabaseClient,
} from '@gestor/database';
import { prismaContext } from './prisma-context';

/**
 * `base`   — client com extensão de escopo de tenant.
 * `system` — client sem extensão (auth/plataforma).
 * `getDb`  — client atual: a transação da requisição (se houver) ou `base`.
 *
 * Ambos usam o papel de aplicação (`APP_DATABASE_URL`), sujeito à RLS.
 */
const globalForPrisma = globalThis as unknown as {
  __prismaBase?: DatabaseClient;
  __prismaSystem?: ReturnType<typeof createSystemPrismaClient>;
};

export const base: DatabaseClient =
  globalForPrisma.__prismaBase ?? createPrismaClient();

export const system =
  globalForPrisma.__prismaSystem ?? createSystemPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prismaBase = base;
  globalForPrisma.__prismaSystem = system;
}

/** Client escopado à transação corrente (ou ao client base). */
export function getDb(): DatabaseClient {
  const tx = prismaContext.getStore();
  return (tx as DatabaseClient | undefined) ?? base;
}
