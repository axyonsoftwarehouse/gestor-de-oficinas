import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Guarda o client de transação Prisma ativo na requisição (se houver),
 * permitindo que `PrismaService.client` reuse a mesma transação — onde o
 * `app.current_tenant` já foi definido para a RLS.
 */
export const prismaContext = new AsyncLocalStorage<unknown>();
