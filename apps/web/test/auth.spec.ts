import { describe, expect, it } from 'vitest';
import { auth } from '../src/server/auth/auth';
import { provisionTenant } from '../src/server/auth/provision';
import { system } from '../src/server/db/prisma';
import { createTestTenant } from './helpers';

describe('Autenticação (Better Auth)', () => {
  it('provisiona o owner e autentica', async () => {
    const t = await createTestTenant();
    const result = await auth.api.signInEmail({
      body: { email: t.email, password: t.password },
    });
    expect(result.user.id).toBe(t.userId);
  });

  it('rejeita credenciais inválidas', async () => {
    const t = await createTestTenant();
    await expect(
      auth.api.signInEmail({ body: { email: t.email, password: 'senha-errada' } }),
    ).rejects.toThrow();
  });

  it('resolve o vínculo e as permissões do owner', async () => {
    const t = await createTestTenant();
    const membership = await system.membership.findFirst({
      where: { userId: t.userId, status: 'ACTIVE' },
      include: {
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });
    const permissions = new Set(
      membership?.roles.flatMap((membershipRole) =>
        membershipRole.role.permissions.map((rolePermission) => rolePermission.permission.code),
      ),
    );
    expect(permissions.size).toBe(90);
  });

  it('não permite slug duplicado', async () => {
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const slug = `dup-${id}`;
    await provisionTenant({
      tenantName: `Dup ${id}`,
      slug,
      ownerName: 'Dup',
      ownerEmail: `dup.${id}@test.local`,
      ownerPassword: 'senha12345',
    });
    await expect(
      provisionTenant({
        tenantName: `Dup 2 ${id}`,
        slug,
        ownerName: 'Dup',
        ownerEmail: `dup2.${id}@test.local`,
        ownerPassword: 'senha12345',
      }),
    ).rejects.toThrow();
  });
});
