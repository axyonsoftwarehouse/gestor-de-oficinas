import { Prisma, StockMovementType } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { BadRequestError, NotFoundError } from '../http/errors';
import type { CreateLocationDto } from '../dtos/create-location.dto';
import type { CreateMovementDto } from '../dtos/create-movement.dto';
import type { IssueToJobDto } from '../dtos/issue-to-job.dto';
import type { QueryBalanceDto } from '../dtos/query-balance.dto';
import type { QueryMovementDto } from '../dtos/query-movement.dto';
import { addJobLine } from './job-cards.service';
import { assertPartRef } from './references.service';

const INBOUND: StockMovementType[] = ['INITIAL', 'PURCHASE', 'RETURN_IN'];

export interface MovementInput {
  locationId: string;
  partId: string;
  type: StockMovementType;
  quantity: Prisma.Decimal;
  unitCost?: number;
  refType?: string;
  refId?: string;
  notes?: string;
  createdById?: string;
}

export function listLocations(branchId?: string) {
  return getDb().stockLocation.findMany({
    where: branchId ? { branchId } : {},
    orderBy: { name: 'asc' },
    include: { branch: { select: { id: true, name: true } } },
  });
}

export function createLocation(dto: CreateLocationDto) {
  return getDb().stockLocation.create({
    data: { tenantId: requireTenantId(), branchId: dto.branchId, name: dto.name },
  });
}

export async function createMovement(dto: CreateMovementDto, userId: string) {
  return recordMovement({
    locationId: dto.locationId,
    partId: dto.partId,
    type: dto.type,
    quantity: signFor(dto.type, dto.quantity),
    unitCost: dto.unitCost,
    refType: dto.refType,
    refId: dto.refId,
    notes: dto.notes,
    createdById: userId,
  });
}

export async function issueToJob(dto: IssueToJobDto, userId: string) {
  const part = await getDb().partCatalog.findFirst({
    where: { id: dto.partId, deletedAt: null },
  });
  if (!part) throw new NotFoundError('Peça não encontrada');

  const quantity = new Prisma.Decimal(dto.quantity).abs();
  const result = await recordMovement({
    locationId: dto.locationId,
    partId: dto.partId,
    type: 'ISSUE_TO_JOB',
    quantity: quantity.negated(),
    refType: 'job_card',
    refId: dto.jobCardId,
    createdById: userId,
  });

  if (dto.addToJob !== false) {
    await addJobLine(dto.jobCardId, {
      type: 'PART',
      partId: dto.partId,
      description: part.name,
      quantity: dto.quantity,
      unitPrice: Number(part.salePrice),
    });
  }

  return result;
}

export async function listBalances(query: QueryBalanceDto) {
  const where: Prisma.StockBalanceWhereInput = {};
  if (query.locationId) where.locationId = query.locationId;
  if (query.partId) where.partId = query.partId;

  const balances = await getDb().stockBalance.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      part: {
        select: { id: true, name: true, sku: true, minStock: true, salePrice: true },
      },
      location: { select: { id: true, name: true } },
    },
  });

  return query.lowStock
    ? balances.filter((balance) => balance.quantity.lte(balance.part.minStock))
    : balances;
}

export async function listMovements(query: QueryMovementDto) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.StockMovementWhereInput = {};
  if (query.locationId) where.locationId = query.locationId;
  if (query.partId) where.partId = query.partId;
  if (query.refId) where.refId = query.refId;
  if (query.type) where.type = query.type;

  const [items, total] = await Promise.all([
    getDb().stockMovement.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        part: { select: { id: true, name: true, sku: true } },
        location: { select: { id: true, name: true } },
      },
    }),
    getDb().stockMovement.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

function signFor(type: StockMovementType, quantity: number): Prisma.Decimal {
  const value = new Prisma.Decimal(quantity);
  if (type === 'ADJUSTMENT') return value;
  return INBOUND.includes(type) ? value.abs() : value.abs().negated();
}

export async function recordMovement(input: MovementInput) {
  const location = await getDb().stockLocation.findFirst({
    where: { id: input.locationId },
  });
  if (!location) throw new NotFoundError('Local de estoque não encontrado');

  await assertPartRef(input.partId);

  const tenantId = requireTenantId();

  const currentBalance = await getDb().stockBalance.findUnique({
    where: {
      locationId_partId: { locationId: input.locationId, partId: input.partId },
    },
    select: { quantity: true },
  });
  const resulting = (currentBalance?.quantity ?? new Prisma.Decimal(0)).plus(
    input.quantity,
  );
  if (resulting.lt(0)) {
    throw new BadRequestError('Saldo de estoque insuficiente para esta operação');
  }

  const movement = await getDb().stockMovement.create({
    data: {
      tenantId,
      branchId: location.branchId,
      locationId: input.locationId,
      partId: input.partId,
      type: input.type,
      quantity: input.quantity,
      unitCost: input.unitCost,
      refType: input.refType,
      refId: input.refId,
      notes: input.notes,
      createdById: input.createdById,
    },
  });

  const balance = await getDb().stockBalance.upsert({
    where: {
      locationId_partId: { locationId: input.locationId, partId: input.partId },
    },
    create: {
      tenantId,
      locationId: input.locationId,
      partId: input.partId,
      quantity: input.quantity,
    },
    update: { quantity: { increment: input.quantity } },
  });

  return { movement, balance };
}
