import { JobStatus, Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { BadRequestError, NotFoundError } from '../http/errors';
import type { AssignMechanicDto } from '../dtos/assign-mechanic.dto';
import type { CreateJobCardDto } from '../dtos/create-job-card.dto';
import type { CreateJobLineDto } from '../dtos/create-job-line.dto';
import type { QueryJobCardDto } from '../dtos/query-job-card.dto';
import type { TransitionJobCardDto } from '../dtos/transition-job-card.dto';
import type { UpdateJobCardDto } from '../dtos/update-job-card.dto';
import type { UpdateJobLineDto } from '../dtos/update-job-line.dto';
import { calculateLine } from './line-calculator.service';
import { nextNumber } from './number-sequence.service';
import { assertCustomerRef, assertLineRefs, assertVehicleRef } from './references.service';

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
  branch: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true, phone: true, email: true } },
  vehicle: {
    select: {
      id: true,
      plate: true,
      vin: true,
      year: true,
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
  invoices: {
    where: { deletedAt: null },
    select: { id: true, number: true, status: true },
    orderBy: { createdAt: 'desc' as const },
  },
  _count: { select: { quotations: true, invoices: true } },
} satisfies Prisma.JobCardInclude;

export async function createJobCard(dto: CreateJobCardDto, userId: string) {
  await assertCustomerRef(dto.customerId);
  await assertVehicleRef(dto.vehicleId);

  const number = await nextNumber('job_card', { prefix: 'JC-', padding: 6 });

  return getDb().jobCard.create({
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

export async function listJobCards(query: QueryJobCardDto) {
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
    getDb().jobCard.findMany({
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
    getDb().jobCard.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findJobCard(id: string) {
  const job = await getDb().jobCard.findFirst({
    where: { id, deletedAt: null },
    include: detailInclude,
  });
  if (!job) throw new NotFoundError('OS não encontrada');
  return job;
}

export async function updateJobCard(id: string, dto: UpdateJobCardDto) {
  await assertJob(id);
  await getDb().jobCard.update({
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
  await recalcTotals(id);
  return findJobCard(id);
}

export async function transitionJobCard(
  id: string,
  dto: TransitionJobCardDto,
  userId: string,
) {
  const job = await assertJob(id);
  const allowed = ALLOWED_TRANSITIONS[job.status] ?? [];
  if (!allowed.includes(dto.status)) {
    throw new BadRequestError(`Transição inválida: ${job.status} -> ${dto.status}`);
  }

  const timestamps: Prisma.JobCardUpdateInput = {};
  if (dto.status === 'IN_PROGRESS' && !job.startedAt) timestamps.startedAt = new Date();
  if (dto.status === 'COMPLETED') timestamps.completedAt = new Date();
  if (dto.status === 'DELIVERED') timestamps.deliveredAt = new Date();
  if (dto.status === 'LOCKED') timestamps.lockedAt = new Date();

  const updated = await getDb().jobCard.update({
    where: { id },
    data: { status: dto.status, ...timestamps },
  });
  await getDb().jobStatusHistory.create({
    data: {
      jobCardId: id,
      fromStatus: job.status,
      toStatus: dto.status,
      changedById: userId,
      reason: dto.reason,
    },
  });
  return updated;
}

export async function addJobLine(jobCardId: string, dto: CreateJobLineDto) {
  assertJobEditable(await assertJob(jobCardId));
  await assertLineRefs({
    serviceId: dto.serviceId,
    partId: dto.partId,
    unitId: dto.unitId,
  });

  const amounts = await calculateLine({
    quantity: dto.quantity ?? 1,
    unitPrice: dto.unitPrice ?? 0,
    discountType: dto.discountType ?? null,
    discountValue: dto.discountValue ?? 0,
    taxIds: dto.taxIds,
  });

  const line = await getDb().jobLine.create({
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

  await recalcTotals(jobCardId);
  return line;
}

export async function updateJobLine(
  jobCardId: string,
  lineId: string,
  dto: UpdateJobLineDto,
) {
  const existing = await getDb().jobLine.findFirst({
    where: { id: lineId, jobCardId },
    include: { taxes: true },
  });
  if (!existing) throw new NotFoundError('Item da OS não encontrado');
  assertJobEditable(await assertJob(jobCardId));
  await assertLineRefs({
    serviceId: dto.serviceId,
    partId: dto.partId,
    unitId: dto.unitId,
  });

  const effectiveTaxIds = dto.taxIds ?? existing.taxes.map((tax) => tax.taxId);
  const amounts = await calculateLine({
    quantity: dto.quantity ?? Number(existing.quantity),
    unitPrice: dto.unitPrice ?? Number(existing.unitPrice),
    discountType: dto.discountType ?? existing.discountType,
    discountValue: dto.discountValue ?? Number(existing.discountValue),
    taxIds: effectiveTaxIds,
  });

  await getDb().jobLineTax.deleteMany({ where: { lineId } });
  const line = await getDb().jobLine.update({
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

  await recalcTotals(jobCardId);
  return line;
}

export async function removeJobLine(
  jobCardId: string,
  lineId: string,
): Promise<{ success: true }> {
  const existing = await getDb().jobLine.findFirst({
    where: { id: lineId, jobCardId },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError('Item da OS não encontrado');
  assertJobEditable(await assertJob(jobCardId));

  await getDb().jobLine.delete({ where: { id: lineId } });
  await recalcTotals(jobCardId);
  return { success: true };
}

export async function assignMechanic(jobCardId: string, dto: AssignMechanicDto) {
  assertJobEditable(await assertJob(jobCardId));
  return getDb().jobMechanic.upsert({
    where: { jobCardId_userId: { jobCardId, userId: dto.userId } },
    create: { jobCardId, userId: dto.userId, role: dto.role, hours: dto.hours },
    update: { role: dto.role, hours: dto.hours },
  });
}

export async function removeMechanic(
  jobCardId: string,
  userId: string,
): Promise<{ success: true }> {
  assertJobEditable(await assertJob(jobCardId));
  await getDb().jobMechanic.deleteMany({ where: { jobCardId, userId } });
  return { success: true };
}

async function assertJob(id: string) {
  const job = await getDb().jobCard.findFirst({
    where: { id, deletedAt: null },
  });
  if (!job) throw new NotFoundError('OS não encontrada');
  return job;
}

/** Status em que a OS não pode mais sofrer alterações de itens/mecânicos. */
const FINAL_STATUSES: JobStatus[] = ['CANCELLED', 'DELIVERED', 'LOCKED'];

function assertJobEditable(job: { status: JobStatus }): void {
  if (FINAL_STATUSES.includes(job.status)) {
    throw new BadRequestError(`OS em ${job.status} não pode ser alterada`);
  }
}

async function recalcTotals(jobCardId: string): Promise<void> {
  const [lines, job] = await Promise.all([
    getDb().jobLine.findMany({
      where: { jobCardId },
      select: { taxBase: true, taxAmount: true },
    }),
    getDb().jobCard.findUnique({
      where: { id: jobCardId },
      select: { discountType: true, discountValue: true },
    }),
  ]);

  const subtotal = lines.reduce(
    (sum, line) => sum.plus(line.taxBase),
    new Prisma.Decimal(0),
  );
  const taxTotal = lines.reduce(
    (sum, line) => sum.plus(line.taxAmount),
    new Prisma.Decimal(0),
  );

  const discountValue = new Prisma.Decimal(job?.discountValue ?? 0);
  const discount =
    job?.discountType === 'PERCENT'
      ? subtotal.mul(discountValue).div(100)
      : job?.discountType === 'AMOUNT'
        ? discountValue
        : new Prisma.Decimal(0);

  await getDb().jobCard.update({
    where: { id: jobCardId },
    data: {
      subtotal,
      taxTotal,
      total: subtotal.plus(taxTotal).minus(discount),
    },
  });
}
