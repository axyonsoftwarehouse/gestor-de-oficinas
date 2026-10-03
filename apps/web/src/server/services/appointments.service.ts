import { Prisma, requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { NotFoundError } from '../http/errors';
import type { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import type { QueryAppointmentDto } from '../dtos/query-appointment.dto';
import type { UpdateAppointmentDto } from '../dtos/update-appointment.dto';
import type { UpdateAppointmentStatusDto } from '../dtos/update-appointment-status.dto';

export function createAppointment(dto: CreateAppointmentDto) {
  return getDb().appointment.create({
    data: {
      tenantId: requireTenantId(),
      branchId: dto.branchId,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      type: dto.type,
      scheduledStart: new Date(dto.scheduledStart),
      scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined,
      assignedToId: dto.assignedToId,
      notes: dto.notes,
    },
  });
}

export async function listAppointments(query: QueryAppointmentDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.AppointmentWhereInput = {};
  if (query.branchId) where.branchId = query.branchId;
  if (query.customerId) where.customerId = query.customerId;
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.scheduledStart = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  const [items, total] = await Promise.all([
    getDb().appointment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { scheduledStart: 'asc' },
      include: {
        customer: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plate: true } },
      },
    }),
    getDb().appointment.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findAppointment(id: string) {
  const appointment = await getDb().appointment.findFirst({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      assignedTo: { select: { id: true, name: true } },
    },
  });
  if (!appointment) throw new NotFoundError('Agendamento não encontrado');
  return appointment;
}

export async function updateAppointment(id: string, dto: UpdateAppointmentDto) {
  await findAppointment(id);
  return getDb().appointment.update({
    where: { id },
    data: {
      branchId: dto.branchId,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      type: dto.type,
      scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : undefined,
      scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined,
      assignedToId: dto.assignedToId,
      notes: dto.notes,
    },
  });
}

export async function updateAppointmentStatus(
  id: string,
  dto: UpdateAppointmentStatusDto,
) {
  await findAppointment(id);
  return getDb().appointment.update({
    where: { id },
    data: { status: dto.status },
  });
}

export async function removeAppointment(id: string): Promise<{ success: true }> {
  await findAppointment(id);
  await getDb().appointment.delete({ where: { id } });
  return { success: true };
}
