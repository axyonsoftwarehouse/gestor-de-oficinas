import { requireTenantId } from '@gestor/database';
import { getDb, system } from '../db/prisma';
import { BadRequestError, NotFoundError } from '../http/errors';
import type { CreateRoleDto } from '../dtos/create-role.dto';
import type { UpdateRoleDto } from '../dtos/update-role.dto';

export function listRoles() {
  return getDb().role.findMany({
    where: { tenantId: requireTenantId() },
    orderBy: { name: 'asc' },
    include: { _count: { select: { permissions: true, memberships: true } } },
  });
}

export async function findRole(id: string) {
  const role = await getDb().role.findFirst({
    where: { id, tenantId: requireTenantId() },
    include: { permissions: { include: { permission: true } } },
  });
  if (!role) throw new NotFoundError('Papel não encontrado');
  return role;
}

export function listPermissions() {
  return system.permission.findMany({
    orderBy: [{ feature: 'asc' }, { action: 'asc' }],
  });
}

export async function createRole(dto: CreateRoleDto) {
  const tenantId = requireTenantId();
  const slug = await uniqueSlug(tenantId, dto.name);

  const role = await getDb().role.create({
    data: {
      tenantId,
      name: dto.name,
      slug,
      description: dto.description,
      scope: 'TENANT',
    },
  });

  if (dto.permissionCodes && dto.permissionCodes.length > 0) {
    const permissions = await getDb().permission.findMany({
      where: { code: { in: dto.permissionCodes } },
      select: { id: true },
    });
    await getDb().rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }

  return findRole(role.id);
}

export async function updateRole(id: string, dto: UpdateRoleDto) {
  await findRole(id);

  await getDb().role.update({
    where: { id },
    data: { name: dto.name, description: dto.description },
  });

  if (dto.permissionCodes) {
    await getDb().rolePermission.deleteMany({ where: { roleId: id } });
    if (dto.permissionCodes.length > 0) {
      const permissions = await getDb().permission.findMany({
        where: { code: { in: dto.permissionCodes } },
        select: { id: true },
      });
      await getDb().rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  return findRole(id);
}

export async function removeRole(id: string): Promise<{ success: true }> {
  const role = await findRole(id);
  if (role.isSystem) {
    throw new BadRequestError('Papéis de sistema não podem ser removidos');
  }
  const inUse = await getDb().membershipRole.count({ where: { roleId: id } });
  if (inUse > 0) {
    throw new BadRequestError('Papel está em uso por membros da equipe');
  }
  await getDb().role.delete({ where: { id } });
  return { success: true };
}

async function uniqueSlug(tenantId: string, name: string): Promise<string> {
  const base =
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50) || 'papel';

  let slug = base;
  let suffix = 2;
  while (await getDb().role.findFirst({ where: { tenantId, slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}
