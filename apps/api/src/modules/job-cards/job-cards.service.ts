import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import { LineCalculatorService } from '../../common/services/line-calculator.service';
import { NumberSequenceService } from '../../common/services/number-sequence.service';
import type { AssignMechanicDto } from './dto/assign-mechanic.dto';
import type { CreateJobCardDto } from './dto/create-job-card.dto';
import type { CreateJobLineDto } from './dto/create-job-line.dto';
import type { QueryJobCardDto } from './dto/query-job-card.dto';
import type { TransitionJobCardDto } from './dto/transition-job-card.dto';
import type { UpdateJobCardDto } from './dto/update-job-card.dto';
import type { UpdateJobLineDto } from './dto/update-job-line.dto';

/** Transições permitidas da máquina de estados da OS. */
const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  DRAFT: ['SCHEDULED', 'CHECKED_IN', 'CANCELLED'],
  SCHEDULED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['IN_INSPECTION', 'IN_PROGRESS', 'WAITING_APPROVAL', 'CANCELLED'],
  IN_INSPECTION: ['WAITING_APPROVAL', 'IN_PROGRESS', 'CANCELLED'],
  WAITING_APPROVAL: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'COMPLETED', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['DELIVERED', 'LOCKED'],
  DELIVERED: ['LOCKED'],
  LOCKED: [],
  CANCELLED: [],
};

const detailInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  vehicle: {
    select: {
      id: true,
      plate: true,
      vin: true,
      brand: { select: { name: true } },
      model: { select: { name: true } },
    },
  },
  assignedTo: { select: { id: true, name: true } },
  advisor: { select: { id: true, name: true } },
  lines: {
    orderBy: { sequence: 'asc' as const },
    include: { service: true, part: true, unit: true, taxes: true },
  },
  mechanics: { include: { user: { select: { id: true, name: true } } } },
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
  inspection: { select: { id: true, status: true } },
  _count: { select: { quotations: true, invoices: true } },
} satisfies Prisma.JobCardInclude;

@Injectable()
export class JobCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequence: NumberSequenceService,
    private readonly lineCalculator: LineCalculatorService,
  ) {}

  async create(dto: CreateJobCardDto, userId: string) {
    const number = await this.numberSequence.next('job_card', {
      prefix: 'JC-',
      padding: 6,
    });

    return this.prisma.client.jobCard.create({
      data: {
        tenantId: requireTenantId(),
        branchId: dto.branchId,
        number,
        type: dto.type,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        appointmentId: dto.appointmentId,
        assignedToId: dto.assignedToId,
        advisorId: dto.advisorId ?? userId,
        odometerIn: dto.odometerIn,
        odometerUnit: dto.odometerUnit,
        fuelLevel: dto.fuelLevel,
        customerComplaint: dto.customerComplaint,
        internalNotes: dto.internalNotes,
        discountType: dto.discountType,
        discountValue: dto.discountValue ?? 0,
      },
      include: detailInclude,
    });
  }

  async list(query: QueryJobCardDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.JobCardWhereInput = { deletedAt: null };
    if (query.branchId) where.branchId = query.branchId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { number: { contains: query.search, mode: 'insensitive' } },
        { vehicle: { plate: { contains: query.search, mode: 'insensitive' } } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.jobCard.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          vehicle: { select: { id: true, plate: true } },
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.client.jobCard.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const job = await this.prisma.client.jobCard.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    });
    if (!job) throw new NotFoundException('OS não encontrada');
    return job;
  }

  async update(id: string, dto: UpdateJobCardDto) {
    await this.assertJob(id);
    await this.prisma.client.jobCard.update({
      where: { id },
      data: {
        branchId: dto.branchId,
        type: dto.type,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        appointmentId: dto.appointmentId,
        assignedToId: dto.assignedToId,
        advisorId: dto.advisorId,
        odometerIn: dto.odometerIn,
        odometerUnit: dto.odometerUnit,
        fuelLevel: dto.fuelLevel,
        customerComplaint: dto.customerComplaint,
        internalNotes: dto.internalNotes,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
      },
    });
    await this.recalcTotals(id);
    return this.findOne(id);
  }

  async transition(id: string, dto: TransitionJobCardDto, userId: string) {
    const job = await this.assertJob(id);
    const allowed = ALLOWED_TRANSITIONS[job.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Transição inválida: ${job.status} -> ${dto.status}`);
    }

    const timestamps: Prisma.JobCardUpdateInput = {};
    if (dto.status === 'IN_PROGRESS' && !job.startedAt) timestamps.startedAt = new Date();
    if (dto.status === 'COMPLETED') timestamps.completedAt = new Date();
    if (dto.status === 'DELIVERED') timestamps.deliveredAt = new Date();
    if (dto.status === 'LOCKED') timestamps.lockedAt = new Date();

    return this.prisma.runInTransaction(async (tx) => {
      const updated = await tx.jobCard.update({
        where: { id },
        data: { status: dto.status, ...timestamps },
      });
      await tx.jobStatusHistory.create({
        data: {
          jobCardId: id,
          fromStatus: job.status,
          toStatus: dto.status,
          changedById: userId,
          reason: dto.reason,
        },
      });
      return updated;
    });
  }

  async addLine(jobCardId: string, dto: CreateJobLineDto) {
    await this.assertJob(jobCardId);

    const amounts = await this.lineCalculator.calculate({
      quantity: dto.quantity ?? 1,
      unitPrice: dto.unitPrice ?? 0,
      discountType: dto.discountType ?? null,
      discountValue: dto.discountValue ?? 0,
      taxIds: dto.taxIds,
    });

    const line = await this.prisma.client.jobLine.create({
      data: {
        jobCardId,
        type: dto.type,
        serviceId: dto.serviceId,
        partId: dto.partId,
        description: dto.description,
        quantity: amounts.quantity,
        unitId: dto.unitId,
        unitPrice: amounts.unitPrice,
        discountType: dto.discountType,
        discountValue: amounts.discountValue,
        taxBase: amounts.base,
        taxAmount: amounts.taxAmount,
        total: amounts.total,
        sequence: dto.sequence ?? 0,
        taxes: { create: amounts.taxRows },
      },
      include: { taxes: true },
    });

    await this.recalcTotals(jobCardId);
    return line;
  }

  async updateLine(jobCardId: string, lineId: string, dto: UpdateJobLineDto) {
    const existing = await this.prisma.client.jobLine.findFirst({
      where: { id: lineId, jobCardId },
      include: { taxes: true },
    });
    if (!existing) throw new NotFoundException('Item da OS não encontrado');

    const effectiveTaxIds = dto.taxIds ?? existing.taxes.map((tax) => tax.taxId);
    const amounts = await this.lineCalculator.calculate({
      quantity: dto.quantity ?? Number(existing.quantity),
      unitPrice: dto.unitPrice ?? Number(existing.unitPrice),
      discountType: dto.discountType ?? existing.discountType,
      discountValue: dto.discountValue ?? Number(existing.discountValue),
      taxIds: effectiveTaxIds,
    });

    const line = await this.prisma.client.$transaction(async (tx) => {
      await tx.jobLineTax.deleteMany({ where: { lineId } });
      return tx.jobLine.update({
        where: { id: lineId },
        data: {
          type: dto.type,
          serviceId: dto.serviceId,
          partId: dto.partId,
          description: dto.description,
          quantity: amounts.quantity,
          unitId: dto.unitId,
          unitPrice: amounts.unitPrice,
          discountType: dto.discountType,
          discountValue: amounts.discountValue,
          taxBase: amounts.base,
          taxAmount: amounts.taxAmount,
          total: amounts.total,
          taxes: { create: amounts.taxRows },
        },
        include: { taxes: true },
      });
    });

    await this.recalcTotals(jobCardId);
    return line;
  }

  async removeLine(jobCardId: string, lineId: string) {
    const existing = await this.prisma.client.jobLine.findFirst({
      where: { id: lineId, jobCardId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Item da OS não encontrado');

    await this.prisma.client.jobLine.delete({ where: { id: lineId } });
    await this.recalcTotals(jobCardId);
    return { success: true };
  }

  async assignMechanic(jobCardId: string, dto: AssignMechanicDto) {
    await this.assertJob(jobCardId);
    return this.prisma.client.jobMechanic.upsert({
      where: { jobCardId_userId: { jobCardId, userId: dto.userId } },
      create: {
        jobCardId,
        userId: dto.userId,
        role: dto.role,
        hours: dto.hours,
      },
      update: { role: dto.role, hours: dto.hours },
    });
  }

  async removeMechanic(jobCardId: string, userId: string) {
    await this.prisma.client.jobMechanic.deleteMany({ where: { jobCardId, userId } });
    return { success: true };
  }

  private async assertJob(id: string) {
    const job = await this.prisma.client.jobCard.findFirst({
      where: { id, deletedAt: null },
    });
    if (!job) throw new NotFoundException('OS não encontrada');
    return job;
  }

  private async recalcTotals(jobCardId: string): Promise<void> {
    const [lines, job] = await Promise.all([
      this.prisma.client.jobLine.findMany({
        where: { jobCardId },
        select: { total: true, taxAmount: true },
      }),
      this.prisma.client.jobCard.findUnique({
        where: { id: jobCardId },
        select: { discountType: true, discountValue: true },
      }),
    ]);

    const subtotal = lines.reduce((sum, line) => sum.plus(line.total), new Prisma.Decimal(0));
    const taxTotal = lines.reduce((sum, line) => sum.plus(line.taxAmount), new Prisma.Decimal(0));

    const discountValue = new Prisma.Decimal(job?.discountValue ?? 0);
    const discount =
      job?.discountType === 'PERCENT'
        ? subtotal.mul(discountValue).div(100)
        : job?.discountType === 'AMOUNT'
          ? discountValue
          : new Prisma.Decimal(0);

    await this.prisma.client.jobCard.update({
      where: { id: jobCardId },
      data: {
        subtotal,
        taxTotal,
        total: subtotal.plus(taxTotal).minus(discount),
      },
    });
  }
}
