import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JobCardsService } from '../job-cards/job-cards.service';
import type { CreateLocationDto } from './dto/create-location.dto';
import type { CreateMovementDto } from './dto/create-movement.dto';
import type { IssueToJobDto } from './dto/issue-to-job.dto';
import type { QueryBalanceDto } from './dto/query-balance.dto';
import type { QueryMovementDto } from './dto/query-movement.dto';

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

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobCardsService: JobCardsService,
  ) {}

  listLocations(branchId?: string) {
    return this.prisma.client.stockLocation.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { name: 'asc' },
      include: { branch: { select: { id: true, name: true } } },
    });
  }

  createLocation(dto: CreateLocationDto) {
    return this.prisma.client.stockLocation.create({
      data: { tenantId: requireTenantId(), branchId: dto.branchId, name: dto.name },
    });
  }

  async createMovement(dto: CreateMovementDto, userId: string) {
    return this.recordMovement({
      locationId: dto.locationId,
      partId: dto.partId,
      type: dto.type,
      quantity: this.signFor(dto.type, dto.quantity),
      unitCost: dto.unitCost,
      refType: dto.refType,
      refId: dto.refId,
      notes: dto.notes,
      createdById: userId,
    });
  }

  async issueToJob(dto: IssueToJobDto, userId: string) {
    const part = await this.prisma.client.partCatalog.findFirst({
      where: { id: dto.partId, deletedAt: null },
    });
    if (!part) throw new NotFoundException('Peça não encontrada');

    const quantity = new Prisma.Decimal(dto.quantity).abs();
    const result = await this.recordMovement({
      locationId: dto.locationId,
      partId: dto.partId,
      type: 'ISSUE_TO_JOB',
      quantity: quantity.negated(),
      refType: 'job_card',
      refId: dto.jobCardId,
      createdById: userId,
    });

    if (dto.addToJob !== false) {
      await this.jobCardsService.addLine(dto.jobCardId, {
        type: 'PART',
        partId: dto.partId,
        description: part.name,
        quantity: dto.quantity,
        unitPrice: Number(part.salePrice),
      });
    }

    return result;
  }

  async listBalances(query: QueryBalanceDto) {
    const where: Prisma.StockBalanceWhereInput = {};
    if (query.locationId) where.locationId = query.locationId;
    if (query.partId) where.partId = query.partId;

    const balances = await this.prisma.client.stockBalance.findMany({
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

  async listMovements(query: QueryMovementDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.StockMovementWhereInput = {};
    if (query.locationId) where.locationId = query.locationId;
    if (query.partId) where.partId = query.partId;
    if (query.refId) where.refId = query.refId;
    if (query.type) where.type = query.type;

    const [items, total] = await Promise.all([
      this.prisma.client.stockMovement.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          part: { select: { id: true, name: true, sku: true } },
          location: { select: { id: true, name: true } },
        },
      }),
      this.prisma.client.stockMovement.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  private signFor(type: StockMovementType, quantity: number): Prisma.Decimal {
    const value = new Prisma.Decimal(quantity);
    if (type === 'ADJUSTMENT') return value;
    return INBOUND.includes(type) ? value.abs() : value.abs().negated();
  }

  async recordMovement(input: MovementInput) {
    return this.prisma.runInTransaction(async (tx) => {
      const location = await tx.stockLocation.findFirst({
        where: { id: input.locationId },
      });
      if (!location) throw new NotFoundException('Local de estoque não encontrado');

      const tenantId = requireTenantId();

      const movement = await tx.stockMovement.create({
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

      const balance = await tx.stockBalance.upsert({
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
    });
  }
}
