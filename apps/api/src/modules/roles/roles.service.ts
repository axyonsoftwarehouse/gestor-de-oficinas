import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.client.role.findMany({
      where: { tenantId: requireTenantId() },
      orderBy: { name: 'asc' },
      include: { _count: { select: { permissions: true, memberships: true } } },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.client.role.findFirst({
      where: { id, tenantId: requireTenantId() },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Papel não encontrado');
    return role;
  }

  listPermissions() {
    return this.prisma.system.permission.findMany({
      orderBy: [{ feature: 'asc' }, { action: 'asc' }],
    });
  }

  async create(dto: CreateRoleDto) {
    const tenantId = requireTenantId();
    const slug = await this.uniqueSlug(tenantId, dto.name);

    const roleId = await this.prisma.runInTransaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          tenantId,
          name: dto.name,
          slug,
          description: dto.description,
          scope: 'TENANT',
        },
      });
      if (dto.permissionCodes?.length) {
        const permissions = await tx.permission.findMany({
          where: { code: { in: dto.permissionCodes } },
          select: { id: true },
        });
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }
      return role.id;
    });

    return this.findOne(roleId);
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);

    await this.prisma.runInTransaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: { name: dto.name, description: dto.description },
      });
      if (dto.permissionCodes) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (dto.permissionCodes.length) {
          const permissions = await tx.permission.findMany({
            where: { code: { in: dto.permissionCodes } },
            select: { id: true },
          });
          await tx.rolePermission.createMany({
            data: permissions.map((permission) => ({
              roleId: id,
              permissionId: permission.id,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new BadRequestException('Papéis de sistema não podem ser removidos');
    }
    const inUse = await this.prisma.client.membershipRole.count({
      where: { roleId: id },
    });
    if (inUse > 0) {
      throw new BadRequestException('Papel está em uso por membros da equipe');
    }
    await this.prisma.client.role.delete({ where: { id } });
    return { success: true };
  }

  private async uniqueSlug(tenantId: string, name: string): Promise<string> {
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
    // eslint-disable-next-line no-await-in-loop
    while (await this.prisma.client.role.findFirst({ where: { tenantId, slug } })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }
}
