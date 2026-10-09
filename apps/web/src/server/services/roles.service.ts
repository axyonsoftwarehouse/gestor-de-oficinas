import { hasAllPermissions } from '@gestor/shared';
import { requireTenantId } from '@gestor/database';
import { getDb, system } from '../db/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../http/errors';
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

export async function createRole(dto: CreateRoleDto, actorPermissions: string[]) {
  const tenantId = requireTenantId();
  const slug = await uniqueSlug(tenantId, dto.name);

  const permissions = await resolveGrantablePermissions(
    dto.permissionCodes,
    actorPermissions,
  );

  const role = await getDb().role.create({
    data: {
      tenantId,
      name: dto.name,
      slug,
      description: dto.description,
      scope: 'TENANT',
    },
  });

  if (permissions.length > 0) {
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

export async function updateRole(
  id: string,
  dto: UpdateRoleDto,
  actorPermissions: string[],
) {
  const role = await findRole(id);

  if (dto.permissionCodes && role.slug === 'owner') {
    throw new ForbiddenError(
      'As permissões do papel Proprietário não podem ser alteradas',
    );
  }

  const permissions = dto.permissionCodes
    ? await resolveGrantablePermissions(dto.permissionCodes, actorPermissions)
    : null;

  await getDb().role.update({
    where: { id },
    data: { name: dto.name, description: dto.description },
  });

  if (permissions) {
    await getDb().rolePermission.deleteMany({ where: { roleId: id } });
    if (permissions.length > 0) {
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

/** Resolve códigos de permissão e garante que o ator os possui. */
async function resolveGrantablePermissions(
  codes: string[] | undefined,
  actorPermissions: string[],
): Promise<{ id: string }[]> {
  if (!codes || codes.length === 0) return [];

  const permissions = await getDb().permission.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true },
  });

  if (!hasAllPermissions(actorPermissions, permissions.map((p) => p.code))) {
    throw new ForbiddenError('Você não pode conceder permissões que não possui');
  }

  return permissions;
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
