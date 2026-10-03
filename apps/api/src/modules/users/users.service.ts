import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { QueryUserDto } from './dto/query-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

const detailInclude = {
  user: { select: { id: true, name: true, email: true, isActive: true } },
  branch: { select: { id: true, name: true } },
  roles: { include: { role: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.MembershipInclude;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryUserDto) {
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
      this.prisma.client.membership.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'asc' },
        include: detailInclude,
      }),
      this.prisma.client.membership.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const membership = await this.prisma.client.membership.findFirst({
      where: { id },
      include: detailInclude,
    });
    if (!membership) throw new NotFoundException('Membro não encontrado');
    return membership;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.system.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    await this.validateRoles(dto.roleIds ?? []);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const membershipId = await this.prisma.runInTransaction(async (tx) => {
      const tenantId = requireTenantId();
      const user = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash,
          isActive: true,
        },
      });
      const membership = await tx.membership.create({
        data: {
          tenantId,
          userId: user.id,
          branchId: dto.branchId,
          status: 'ACTIVE',
        },
      });
      if (dto.roleIds?.length) {
        await tx.membershipRole.createMany({
          data: dto.roleIds.map((roleId) => ({ membershipId: membership.id, roleId })),
          skipDuplicates: true,
        });
      }
      return membership.id;
    });

    return this.findOne(membershipId);
  }

  async update(id: string, dto: UpdateUserDto) {
    const membership = await this.findOne(id);
    if (dto.roleIds) await this.validateRoles(dto.roleIds);
    if (membership.isOwner && dto.status === 'DISABLED') {
      throw new BadRequestException('O proprietário não pode ser desativado');
    }

    await this.prisma.runInTransaction(async (tx) => {
      if (dto.name !== undefined) {
        await tx.user.update({
          where: { id: membership.user.id },
          data: { name: dto.name },
        });
      }
      await tx.membership.update({
        where: { id },
        data: { branchId: dto.branchId, status: dto.status },
      });
      if (dto.roleIds) {
        await tx.membershipRole.deleteMany({ where: { membershipId: id } });
        if (dto.roleIds.length) {
          await tx.membershipRole.createMany({
            data: dto.roleIds.map((roleId) => ({ membershipId: id, roleId })),
            skipDuplicates: true,
          });
        }
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const membership = await this.findOne(id);
    if (membership.isOwner) {
      throw new BadRequestException('O proprietário não pode ser removido');
    }
    await this.prisma.client.membership.update({
      where: { id },
      data: { status: 'DISABLED' },
    });
    return { success: true };
  }

  private async validateRoles(roleIds: string[]): Promise<void> {
    if (roleIds.length === 0) return;
    const roles = await this.prisma.client.role.findMany({
      where: { id: { in: roleIds }, tenantId: requireTenantId() },
      select: { id: true },
    });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Papel inválido');
    }
  }
}
