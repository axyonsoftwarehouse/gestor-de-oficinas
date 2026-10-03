import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateVehicleDto } from './dto/create-vehicle.dto';
import type { QueryVehicleDto } from './dto/query-vehicle.dto';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto) {
    await this.assertCustomer(dto.customerId);
    return this.prisma.client.vehicle.create({
      data: { ...dto, tenantId: requireTenantId() },
    });
  }

  async list(query: QueryVehicleDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.VehicleWhereInput = { deletedAt: null };
    if (query.customerId) where.customerId = query.customerId;
    if (query.search) {
      where.OR = [
        { plate: { contains: query.search, mode: 'insensitive' } },
        { vin: { contains: query.search, mode: 'insensitive' } },
        { chassis: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.vehicle.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          model: { select: { id: true, name: true } },
        },
      }),
      this.prisma.client.vehicle.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.client.vehicle.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        model: { select: { id: true, name: true } },
        fuelType: { select: { id: true, name: true } },
        color: { select: { id: true, name: true } },
      },
    });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    if (dto.customerId) await this.assertCustomer(dto.customerId);
    return this.prisma.client.vehicle.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  private async assertCustomer(customerId: string): Promise<void> {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      select: { id: true },
    });
    if (!customer) throw new BadRequestException('Cliente inválido');
  }
}
