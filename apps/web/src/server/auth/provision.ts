import 'server-only';
import {
  ROLE_TEMPLATES,
  listPermissionDefinitions,
  resolveRolePermissions,
} from '@gestor/shared';
import { system } from '../db/prisma';
import { ConflictError } from '../http/errors';
import { auth } from './auth';
import type { RegisterTenantDto } from './dto/register-tenant.dto';

export interface ProvisionedTenant {
  user: { id: string; email: string; name: string };
  tenant: { id: string; name: string; slug: string };
  membershipId: string;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

/**
 * Provisiona uma nova oficina + owner.
 * O usuário é criado pelo Better Auth (credential account); tenant/filial/papéis
 * e vínculo são criados numa transação com o tenant corrente definido (RLS).
 */
export async function provisionTenant(
  dto: RegisterTenantDto,
): Promise<ProvisionedTenant> {
  const slug = dto.slug ?? slugify(dto.tenantName);

  const [slugTaken, emailTaken] = await Promise.all([
    system.tenant.findUnique({ where: { slug }, select: { id: true } }),
    system.user.findUnique({ where: { email: dto.ownerEmail }, select: { id: true } }),
  ]);
  if (slugTaken) throw new ConflictError('Já existe uma oficina com este slug');
  if (emailTaken) throw new ConflictError('E-mail já cadastrado');

  const signUp = await createAuthUser(dto);

  try {
    const { tenant, membership } = await system.$transaction(
      async (tx) => {
        await tx.permission.createMany({
          data: listPermissionDefinitions().map((definition) => ({
            code: definition.code,
            feature: definition.feature,
            action: definition.action,
          })),
          skipDuplicates: true,
        });

        const tenant = await tx.tenant.create({
          data: { name: dto.tenantName, slug, status: 'ACTIVE', plan: 'trial' },
        });

        // Define o tenant corrente para o RLS permitir criar os registros.
        await tx.$executeRaw`select set_config('app.current_tenant', ${tenant.id}, true)`;

        const branch = await tx.branch.create({
          data: { tenantId: tenant.id, name: 'Matriz', code: 'MATRIZ' },
        });

        let ownerRoleId: string | undefined;
        for (const template of ROLE_TEMPLATES) {
          const role = await tx.role.create({
            data: {
              tenantId: tenant.id,
              name: template.name,
              slug: template.slug,
              description: template.description,
              scope: 'TENANT',
              isSystem: true,
            },
          });
          const permissions = await tx.permission.findMany({
            where: { code: { in: resolveRolePermissions(template) } },
            select: { id: true },
          });
          if (permissions.length > 0) {
            await tx.rolePermission.createMany({
              data: permissions.map((permission) => ({
                roleId: role.id,
                permissionId: permission.id,
              })),
              skipDuplicates: true,
            });
          }
          if (template.isOwner) ownerRoleId = role.id;
        }

        const membership = await tx.membership.create({
          data: {
            tenantId: tenant.id,
            userId: signUp.userId,
            branchId: branch.id,
            isOwner: true,
            status: 'ACTIVE',
          },
        });
        if (ownerRoleId) {
          await tx.membershipRole.create({
            data: { membershipId: membership.id, roleId: ownerRoleId },
          });
        }

        return { tenant, membership };
      },
      { timeout: 15000, maxWait: 10000 },
    );

    await system.user.update({
      where: { id: signUp.userId },
      data: { defaultTenantId: tenant.id },
    });

    return {
      user: signUp.user,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      membershipId: membership.id,
    };
  } catch (error) {
    // Evita usuário órfão no Better Auth se o provisionamento falhar.
    await system.user.delete({ where: { id: signUp.userId } }).catch(() => undefined);
    throw error;
  }
}

async function createAuthUser(
  dto: RegisterTenantDto,
): Promise<{ userId: string; user: { id: string; email: string; name: string } }> {
  const result = await auth.api.signUpEmail({
    body: {
      email: dto.ownerEmail,
      password: dto.ownerPassword,
      name: dto.ownerName,
    },
  });
  return {
    userId: result.user.id,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    },
  };
}
