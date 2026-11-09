import 'server-only';
import type { QuotationStatus } from '@prisma/client';
import { getDb, system } from '../db/prisma';
import { withTenant } from '../db/with-tenant';
import { BadRequestError } from '../http/errors';
import { InvalidPublicLinkError, parseQuotationLink } from '../public-links';

const publicInclude = {
  customer: { select: { name: true } },
  jobCard: {
    select: {
      number: true,
      vehicle: {
        select: {
          plate: true,
          brand: { select: { name: true } },
          model: { select: { name: true } },
        },
      },
    },
  },
  lines: {
    orderBy: { sequence: 'asc' as const },
    select: {
      id: true,
      type: true,
      description: true,
      quantity: true,
      unitPrice: true,
      total: true,
    },
  },
};

export interface PublicQuotation {
  number: string;
  status: QuotationStatus;
  currency: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  validUntil: string | null;
  notes: string | null;
  customerName: string | null;
  vehiclePlate: string | null;
  vehicleLabel: string | null;
  jobNumber: string | null;
  lines: {
    id: string;
    type: string;
    description: string | null;
    quantity: string;
    unitPrice: string;
    total: string;
  }[];
  tenantName: string;
  expiresAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Em elaboração',
  SENT: 'Aguardando sua aprovação',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  EXPIRED: 'Expirado',
  CONVERTED: 'Faturado',
};

export function quotationStatusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

/** Lê o orçamento do link público. Lança `InvalidPublicLinkError` se não existir. */
export async function getPublicQuotation(token: string): Promise<PublicQuotation> {
  const payload = parseQuotationLink(token);

  const [quotation, tenant] = await Promise.all([
    withTenant(payload.t, undefined, () =>
      getDb().quotation.findFirst({
        where: { id: payload.q },
        include: publicInclude,
      }),
    ),
    system.tenant.findUnique({
      where: { id: payload.t },
      select: { name: true },
    }),
  ]);

  if (!quotation) throw new InvalidPublicLinkError();

  const vehicle = quotation.jobCard?.vehicle;
  const model = [vehicle?.brand?.name, vehicle?.model?.name].filter(Boolean).join(' ');

  return {
    number: quotation.number,
    status: quotation.status,
    currency: quotation.currency,
    subtotal: quotation.subtotal.toString(),
    taxTotal: quotation.taxTotal.toString(),
    total: quotation.total.toString(),
    validUntil: quotation.validUntil?.toISOString() ?? null,
    notes: quotation.notes ?? null,
    customerName: quotation.customer?.name ?? null,
    vehiclePlate: vehicle?.plate ?? null,
    vehicleLabel: model || null,
    jobNumber: quotation.jobCard?.number ?? null,
    lines: quotation.lines.map((line) => ({
      id: line.id,
      type: line.type,
      description: line.description,
      quantity: line.quantity.toString(),
      unitPrice: line.unitPrice.toString(),
      total: line.total.toString(),
    })),
    tenantName: tenant?.name ?? 'Oficina',
    expiresAt: new Date(payload.e * 1000).toISOString(),
  };
}

export type PublicDecision = 'approve' | 'reject';

const DECIDABLE: QuotationStatus[] = ['DRAFT', 'SENT'];

/**
 * Registra a decisão do cliente. Idempotente: repetir a mesma decisão devolve
 * o estado atual em vez de erro; decisão contrária a um orçamento já fechado
 * é recusada.
 */
export async function decidePublicQuotation(
  token: string,
  decision: PublicDecision,
): Promise<{ number: string; status: QuotationStatus }> {
  const payload = parseQuotationLink(token);

  return withTenant(payload.t, undefined, async () => {
    const quotation = await getDb().quotation.findFirst({
      where: { id: payload.q },
      select: { id: true, number: true, status: true },
    });
    if (!quotation) throw new InvalidPublicLinkError();

    const target: QuotationStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED';
    if (quotation.status === target) {
      return { number: quotation.number, status: target };
    }
    if (!DECIDABLE.includes(quotation.status)) {
      throw new BadRequestError(
        `Este orçamento não aceita mais decisão (${STATUS_LABEL[quotation.status] ?? quotation.status}).`,
      );
    }

    await getDb().quotation.update({
      where: { id: quotation.id },
      data:
        target === 'APPROVED'
          ? { status: 'APPROVED', approvedAt: new Date() }
          : { status: 'REJECTED' },
    });

    await getDb().auditLog.create({
      data: {
        tenantId: payload.t,
        entityType: 'Quotation',
        entityId: quotation.id,
        action: decision === 'approve' ? 'quotation.approved_public' : 'quotation.rejected_public',
        diffJson: { from: quotation.status, to: target, channel: 'public_link' },
      },
    });

    return { number: quotation.number, status: target };
  });
}
