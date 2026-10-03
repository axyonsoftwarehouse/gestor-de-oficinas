import { runWithTenant } from '@gestor/database';
import { base } from './prisma';
import { prismaContext } from './prisma-context';

/**
 * Executa `fn` dentro de uma transação com `app.current_tenant` definido,
 * habilitando o RLS. Mesmo contrato do antigo `TenantContextInterceptor`.
 *
 * Timeout reduzido para caber no limite de função serverless (Vercel).
 */
export function withTenant<T>(
  tenantId: string,
  userId: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  return base.$transaction(
    async (tx) => {
      await tx.$executeRaw`select set_config('app.current_tenant', ${tenantId}, true)`;
      return runWithTenant({ tenantId, userId }, () =>
        prismaContext.run(tx, fn),
      );
    },
    { timeout: 10000, maxWait: 5000 },
  );
}
