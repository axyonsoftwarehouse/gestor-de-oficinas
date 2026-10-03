import 'server-only';
import { headers } from 'next/headers';
import { system } from '../db/prisma';
import { ForbiddenError, UnauthorizedError } from '../http/errors';
import { auth } from './auth';

export interface SessionContext {
  authUserId: string;
  email: string;
  name: string;
  tenantId: string;
  membershipId: string;
  permissions: string[];
  isPlatformAdmin: boolean;
}

/**
 * Resolve a sessão do Better Auth + vínculo/permissões no banco.
 * Permissões resolvidas por requisição (sempre frescas).
 * O tenant ativo é `users.defaultTenantId` (se houver vínculo) ou o mais antigo.
 */
export async function requireSession(): Promise<SessionContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new UnauthorizedError();

  const authUserId = session.user.id;

  const profile = await system.user.findUnique({
    where: { id: authUserId },
    select: {
      name: true,
      email: true,
      isActive: true,
      isPlatformAdmin: true,
      defaultTenantId: true,
    },
  });
  if (!profile || !profile.isActive) {
    throw new UnauthorizedError('Usuário inválido');
  }

  const memberships = await system.membership.findMany({
    where: { userId: authUserId, status: 'ACTIVE' },
    include: {
      roles: {
        include: {
          role: {
            include: { permissions: { include: { permission: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const membership =
    memberships.find((item) => item.tenantId === profile.defaultTenantId) ??
    memberships[0];
  if (!membership) {
    throw new ForbiddenError('Usuário sem oficina ativa');
  }

  const permissions = Array.from(
    new Set(
      membership.roles.flatMap((membershipRole) =>
        membershipRole.role.permissions.map(
          (rolePermission) => rolePermission.permission.code,
        ),
      ),
    ),
  );

  return {
    authUserId,
    email: profile.email,
    name: profile.name,
    tenantId: membership.tenantId,
    membershipId: membership.id,
    permissions: profile.isPlatformAdmin ? ['*'] : permissions,
    isPlatformAdmin: profile.isPlatformAdmin,
  };
}
