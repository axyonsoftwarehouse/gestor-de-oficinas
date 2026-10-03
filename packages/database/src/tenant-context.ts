import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<TenantContext>();

/** Retorna o contexto de tenant corrente (ou `undefined`). */
export function getTenantContext(): TenantContext | undefined {
  return storage.getStore();
}

/** Retorna o `tenantId` corrente ou lança se não houver contexto. */
export function requireTenantId(): string {
  const ctx = storage.getStore();
  if (!ctx?.tenantId) {
    throw new Error('Contexto de tenant ausente (use runWithTenant).');
  }
  return ctx.tenantId;
}

/** Executa `fn` dentro de um contexto de tenant. */
export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return storage.run(context, fn);
}
