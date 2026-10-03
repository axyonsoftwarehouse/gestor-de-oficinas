import { Prisma, requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { BadRequestError, NotFoundError } from '../http/errors';
import type { CreateVehicleDto } from '../dtos/create-vehicle.dto';
import type { QueryVehicleDto } from '../dtos/query-vehicle.dto';
import type { UpdateVehicleDto } from '../dtos/update-vehicle.dto';

export async function createVehicle(dto: CreateVehicleDto) {
  await assertCustomer(dto.customerId);
  return getDb().vehicle.create({
    data: { ...dto, tenantId: requireTenantId() },
  });
}

export async function listVehicles(query: QueryVehicleDto) {
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
    getDb().vehicle.findMany({
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
    getDb().vehicle.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findVehicle(id: string) {
  const vehicle = await getDb().vehicle.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      model: { select: { id: true, name: true } },
      fuelType: { select: { id: true, name: true } },
      color: { select: { id: true, name: true } },
    },
  });
  if (!vehicle) throw new NotFoundError('Veículo não encontrado');
  return vehicle;
}

export async function updateVehicle(id: string, dto: UpdateVehicleDto) {
  await findVehicle(id);
  if (dto.customerId) await assertCustomer(dto.customerId);
  return getDb().vehicle.update({ where: { id }, data: dto });
}

export async function removeVehicle(id: string): Promise<{ success: true }> {
  await findVehicle(id);
  await getDb().vehicle.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}

async function assertCustomer(customerId: string): Promise<void> {
  const customer = await getDb().customer.findFirst({
    where: { id: customerId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) throw new BadRequestError('Cliente inválido');
}
