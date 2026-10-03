import type { PrismaClient } from '@prisma/client';
import {
  ROLE_TEMPLATES,
  listPermissionDefinitions,
  resolveRolePermissions,
} from '@gestor/shared';

/** Sincroniza o catálogo canônico de permissões (idempotente). */
export async function seedPermissions(prisma: PrismaClient): Promise<number> {
  const definitions = listPermissionDefinitions();
  for (const definition of definitions) {
    await prisma.permission.upsert({
      where: { code: definition.code },
      update: { feature: definition.feature, action: definition.action },
      create: {
        code: definition.code,
        feature: definition.feature,
        action: definition.action,
      },
    });
  }
  return definitions.length;
}

/** Cria/atualiza os papéis de sistema de um tenant e suas permissões. */
export async function seedTenantRoles(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  for (const template of ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: { tenantId_slug: { tenantId, slug: template.slug } },
      update: { name: template.name, description: template.description },
      create: {
        tenantId,
        name: template.name,
        slug: template.slug,
        description: template.description,
        scope: 'TENANT',
        isSystem: true,
      },
    });

    const codes = resolveRolePermissions(template);
    const permissions = await prisma.permission.findMany({
      where: { code: { in: codes } },
      select: { id: true },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }
  }
}
