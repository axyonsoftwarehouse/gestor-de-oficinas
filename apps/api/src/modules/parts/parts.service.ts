import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePartDto } from './dto/create-part.dto';
import type { QueryPartDto } from './dto/query-part.dto';
import type { UpdatePartDto } from './dto/update-part.dto';

@Injectable()
export class PartsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePartDto) {
    return this.prisma.client.partCatalog.create({
      data: { ...dto, tenantId: requireTenantId() },
    });
  }

  async list(query: QueryPartDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.PartCatalogWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.partCatalog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: { category: { select: { id: true, name: true } }, unit: true },
      }),
      this.prisma.client.partCatalog.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const part = await this.prisma.client.partCatalog.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, unit: true },
    });
    if (!part) throw new NotFoundException('Peça não encontrada');
    return part;
  }

  async update(id: string, dto: UpdatePartDto) {
    await this.findOne(id);
    return this.prisma.client.partCatalog.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.partCatalog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
