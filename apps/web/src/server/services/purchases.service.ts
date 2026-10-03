import { Prisma } from '@prisma/client';
import { requireTenantId } from '@gestor/database';
import { getDb } from '../db/prisma';
import { BadRequestError, NotFoundError } from '../http/errors';
import type { CreatePurchaseDto } from '../dtos/create-purchase.dto';
import type { QueryPurchaseDto } from '../dtos/query-purchase.dto';
import { nextNumber } from './number-sequence.service';
import { recordMovement } from './stock.service';

const detailInclude = {
  supplier: { select: { id: true, name: true } },
  location: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
  items: {
    include: { part: { select: { id: true, name: true, sku: true } } },
  },
} satisfies Prisma.PurchaseInclude;

export async function createPurchase(dto: CreatePurchaseDto, userId: string) {
  const tenantId = requireTenantId();
  const number = await nextNumber('purchase', { prefix: 'CP-', padding: 6 });

  let subtotal = new Prisma.Decimal(0);
  const itemRows = dto.items.map((item) => {
    const total = new Prisma.Decimal(item.quantity).mul(item.unitCost);
    subtotal = subtotal.plus(total);
    return { ...item, total };
  });

  const purchase = await getDb().purchase.create({
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
    await getDb().purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        partId: item.partId,
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unitCost: new Prisma.Decimal(item.unitCost),
        total: item.total,
      },
    });

    await recordMovement({
      locationId: dto.locationId,
      partId: item.partId,
      type: 'PURCHASE',
      quantity: new Prisma.Decimal(item.quantity).abs(),
      unitCost: item.unitCost,
      refType: 'purchase',
      refId: purchase.id,
      createdById: userId,
    });

    await getDb().partCatalog.update({
      where: { id: item.partId },
      data: { costPrice: item.unitCost },
    });
  }

  if (dto.createExpense !== false) {
    await getDb().expense.create({
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

  return findPurchase(purchase.id);
}

export async function listPurchases(query: QueryPurchaseDto) {
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
    getDb().purchase.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    getDb().purchase.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function findPurchase(id: string) {
  const purchase = await getDb().purchase.findFirst({
    where: { id },
    include: detailInclude,
  });
  if (!purchase) throw new NotFoundError('Compra não encontrada');
  return purchase;
}

/** Cancela a compra, revertendo as entradas de estoque. */
export async function cancelPurchase(id: string) {
  const purchase = await findPurchase(id);
  if (purchase.status === 'CANCELLED') {
    throw new BadRequestError('Compra já cancelada');
  }

  for (const item of purchase.items) {
    await recordMovement({
      locationId: purchase.locationId,
      partId: item.partId,
      type: 'ADJUSTMENT',
      quantity: new Prisma.Decimal(item.quantity).negated(),
      refType: 'purchase_cancel',
      refId: purchase.id,
    });
  }

  await getDb().purchase.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return findPurchase(id);
}
