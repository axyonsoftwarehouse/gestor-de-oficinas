import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAppointmentDto } from './dto/create-appointment.dto';
import type { QueryAppointmentDto } from './dto/query-appointment.dto';
import type { UpdateAppointmentDto } from './dto/update-appointment.dto';
import type { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAppointmentDto) {
    return this.prisma.client.appointment.create({
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

  async list(query: QueryAppointmentDto) {
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
      this.prisma.client.appointment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { scheduledStart: 'asc' },
        include: {
          customer: { select: { id: true, name: true } },
          vehicle: { select: { id: true, plate: true } },
        },
      }),
      this.prisma.client.appointment.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.client.appointment.findFirst({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.findOne(id);
    return this.prisma.client.appointment.update({
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

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    await this.findOne(id);
    return this.prisma.client.appointment.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.appointment.delete({ where: { id } });
    return { success: true };
  }
}
