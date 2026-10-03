import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { PrismaService } from '../../prisma/prisma.service';
import { NumberSequenceService } from '../../common/services/number-sequence.service';
import { StockService } from '../stock/stock.service';
import type { CreatePurchaseDto } from './dto/create-purchase.dto';
import type { QueryPurchaseDto } from './dto/query-purchase.dto';

const detailInclude = {
  supplier: { select: { id: true, name: true } },
  location: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
  items: {
    include: { part: { select: { id: true, name: true, sku: true } } },
  },
} satisfies Prisma.PurchaseInclude;

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequence: NumberSequenceService,
    private readonly stockService: StockService,
  ) {}

  async create(dto: CreatePurchaseDto, userId: string) {
    const tenantId = requireTenantId();
    const number = await this.numberSequence.next('purchase', {
      prefix: 'CP-',
      padding: 6,
    });

    let subtotal = new Prisma.Decimal(0);
    const itemRows = dto.items.map((item) => {
      const total = new Prisma.Decimal(item.quantity).mul(item.unitCost);
      subtotal = subtotal.plus(total);
      return { ...item, total };
    });

    const purchase = await this.prisma.client.purchase.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        locationId: dto.locationId,
        supplierId: dto.supplierId,
        number,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        notes: dto.notes,
        subtotal,
        total: subtotal,
        createdById: userId,
      },
    });

    for (const item of itemRows) {
      await this.prisma.client.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          partId: item.partId,
          description: item.description,
          quantity: new Prisma.Decimal(item.quantity),
          unitCost: new Prisma.Decimal(item.unitCost),
          total: item.total,
        },
      });

      await this.stockService.recordMovement({
        locationId: dto.locationId,
        partId: item.partId,
        type: 'PURCHASE',
        quantity: new Prisma.Decimal(item.quantity).abs(),
        unitCost: item.unitCost,
        refType: 'purchase',
        refId: purchase.id,
        createdById: userId,
      });

      await this.prisma.client.partCatalog.update({
        where: { id: item.partId },
        data: { costPrice: item.unitCost },
      });
    }

    if (dto.createExpense !== false) {
      await this.prisma.client.expense.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          category: 'Compras',
          description: `Compra ${number}`,
          amount: subtotal,
          expenseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : new Date(),
          createdById: userId,
        },
      });
    }

    return this.findOne(purchase.id);
  }

  async list(query: QueryPurchaseDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.PurchaseWhereInput = {};
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.purchaseDate = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.client.purchase.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.client.purchase.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const purchase = await this.prisma.client.purchase.findFirst({
      where: { id },
      include: detailInclude,
    });
    if (!purchase) throw new NotFoundException('Compra não encontrada');
    return purchase;
  }

  /** Cancela a compra, revertendo as entradas de estoque. */
  async cancel(id: string) {
    const purchase = await this.findOne(id);
    if (purchase.status === 'CANCELLED') {
      throw new BadRequestException('Compra já cancelada');
    }

    for (const item of purchase.items) {
      await this.stockService.recordMovement({
        locationId: purchase.locationId,
        partId: item.partId,
        type: 'ADJUSTMENT',
        quantity: new Prisma.Decimal(item.quantity).negated(),
        refType: 'purchase_cancel',
        refId: purchase.id,
      });
    }

    await this.prisma.client.purchase.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return this.findOne(id);
  }
}
