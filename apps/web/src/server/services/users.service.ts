import { Prisma, requireTenantId } from '@gestor/database';
import { auth } from '../auth/auth';
import { getDb, system } from '../db/prisma';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../http/errors';
import type { CreateUserDto } from '../dtos/create-user.dto';
import type { QueryUserDto } from '../dtos/query-user.dto';
import type { UpdateUserDto } from '../dtos/update-user.dto';

const detailInclude = {
  user: { select: { id: true, name: true, email: true, isActive: true } },
  branch: { select: { id: true, name: true } },
  roles: { include: { role: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.MembershipInclude;

export async function listUsers(query: QueryUserDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.MembershipWhereInput = {};
  if (query.branchId) where.branchId = query.branchId;
  if (query.search) {
    where.user = {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ],
    };
  }

  const [items, total] = await Promise.all([
    getDb().membership.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'asc' },
      include: detailInclude,
    }),
    getDb().membership.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findUser(id: string) {
  const membership = await getDb().membership.findFirst({
    where: { id },
    include: detailInclude,
  });
  if (!membership) throw new NotFoundError('Membro não encontrado');
  return membership;
}

export async function createUser(dto: CreateUserDto) {
  const existing = await system.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new ConflictError('E-mail já cadastrado');

  await validateRoles(dto.roleIds ?? []);

  const signUp = await auth.api.signUpEmail({
    body: { email: dto.email, password: dto.password, name: dto.name },
  });

  try {
    const tenantId = requireTenantId();
    const membership = await getDb().membership.create({
      data: {
        tenantId,
        userId: signUp.user.id,
        branchId: dto.branchId,
        status: 'ACTIVE',
      },
    });
    if (dto.roleIds && dto.roleIds.length > 0) {
      await getDb().membershipRole.createMany({
        data: dto.roleIds.map((roleId) => ({ membershipId: membership.id, roleId })),
        skipDuplicates: true,
      });
    }
    return await findUser(membership.id);
  } catch (error) {
    await system.user.delete({ where: { id: signUp.user.id } }).catch(() => undefined);
    throw error;
  }
}

export async function updateUser(id: string, dto: UpdateUserDto) {
  const membership = await findUser(id);
  if (dto.roleIds) await validateRoles(dto.roleIds);
  if (membership.isOwner && dto.status === 'DISABLED') {
    throw new BadRequestError('O proprietário não pode ser desativado');
  }

  if (dto.name !== undefined) {
    await getDb().user.update({
      where: { id: membership.user.id },
      data: { name: dto.name },
    });
  }
  await getDb().membership.update({
    where: { id },
    data: { branchId: dto.branchId, status: dto.status },
  });
  if (dto.roleIds) {
    await getDb().membershipRole.deleteMany({ where: { membershipId: id } });
    if (dto.roleIds.length > 0) {
      await getDb().membershipRole.createMany({
        data: dto.roleIds.map((roleId) => ({ membershipId: id, roleId })),
        skipDuplicates: true,
      });
    }
  }

  return findUser(id);
}

export async function removeUser(id: string): Promise<{ success: true }> {
  const membership = await findUser(id);
  if (membership.isOwner) {
    throw new BadRequestError('O proprietário não pode ser removido');
  }
  await getDb().membership.update({
    where: { id },
    data: { status: 'DISABLED' },
  });
  return { success: true };
}

async function validateRoles(roleIds: string[]): Promise<void> {
  if (roleIds.length === 0) return;
  const roles = await getDb().role.findMany({
    where: { id: { in: roleIds }, tenantId: requireTenantId() },
    select: { id: true },
  });
  if (roles.length !== roleIds.length) {
    throw new BadRequestError('Papel inválido');
  }
}
