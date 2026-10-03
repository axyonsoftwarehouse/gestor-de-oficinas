import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { system } from '@/server/db/prisma';
import { NotFoundError } from '@/server/http/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Dados da sessão para o cliente: usuário, oficina ativa e permissões. */
export function GET(req: NextRequest): Promise<Response> {
  return runRoute({}, req, async (_request, session) => {
    const tenant = await system.tenant.findUnique({
      where: { id: session.tenantId },
      select: { id: true, name: true, slug: true },
    });
    if (!tenant) throw new NotFoundError('Oficina não encontrada');

    return NextResponse.json({
      user: { id: session.authUserId, email: session.email, name: session.name },
      tenant,
      membershipId: session.membershipId,
      permissions: session.permissions,
    });
  });
}
