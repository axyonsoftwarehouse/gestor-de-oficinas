import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import type { QueryCustomerDto } from './dto/query-customer.dto';
import type { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCustomerDto) {
    return this.prisma.client.customer.create({
      data: { ...dto, tenantId: requireTenantId() },
    });
  }

  async list(query: QueryCustomerDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.CustomerWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { document: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.customer.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.client.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
