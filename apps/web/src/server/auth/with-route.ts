import 'server-only';
import type { NextRequest } from 'next/server';
import { withTenant } from '../db/with-tenant';
import { ForbiddenError } from '../http/errors';
import { handleError } from '../http/handle-error';
import { requireSession, type SessionContext } from './require-session';

export interface RouteOptions {
  permissions?: string[];
}

export type AuthedHandler = (
  req: NextRequest,
  session: SessionContext,
) => Promise<Response> | Response;

function assertPermissions(granted: string[], required: string[]): void {
  if (granted.includes('*')) return;
  const missing = required.filter((permission) => !granted.includes(permission));
  if (missing.length > 0) {
    throw new ForbiddenError(`Permissão necessária: ${missing.join(', ')}`);
  }
}

/**
 * Executa um handler de rota com autenticação, checagem de permissões,
 * transação de tenant (RLS) e tratamento de erro. O handler deve ser chamado
 * de dentro do route handler exportado (que controla a assinatura/params).
 */
export function runRoute(
  opts: RouteOptions,
  req: NextRequest,
  handler: AuthedHandler,
): Promise<Response> {
  return (async () => {
    try {
      const session = await requireSession();
      if (opts.permissions && opts.permissions.length > 0) {
        assertPermissions(session.permissions, opts.permissions);
      }
      return await withTenant(session.tenantId, session.authUserId, async () =>
        handler(req, session),
      );
    } catch (error) {
      return handleError(error);
    }
  })();
}
