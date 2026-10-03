import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSupplierDto } from './dto/create-supplier.dto';
import type { QuerySupplierDto } from './dto/query-supplier.dto';
import type { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSupplierDto) {
    return this.prisma.client.supplier.create({
      data: { ...dto, tenantId: requireTenantId() },
    });
  }

  async list(query: QuerySupplierDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.SupplierWhereInput = { isActive: true };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { document: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.supplier.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.supplier.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.client.supplier.findFirst({
      where: { id, isActive: true },
    });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.client.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.supplier.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }
}
