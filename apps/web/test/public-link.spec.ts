import { describe, expect, it, beforeAll } from 'vitest';
import {
  InvalidPublicLinkError,
  createQuotationLink,
  parseQuotationLink,
} from '../src/server/public-links';
import { listBranches } from '../src/server/services/branches.service';
import { createCustomer } from '../src/server/services/customers.service';
import { createVehicle } from '../src/server/services/vehicles.service';
import { addJobLine, createJobCard } from '../src/server/services/job-cards.service';
import { createQuotation, sendQuotation } from '../src/server/services/quotations.service';
import {
  decidePublicQuotation,
  getPublicQuotation,
} from '../src/server/services/public-quotations.service';
import { createTestTenant } from './helpers';

beforeAll(() => {
  process.env.PUBLIC_LINK_SECRET = process.env.PUBLIC_LINK_SECRET ?? 'test-public-link-secret';
});

describe('token do link público', () => {
  it('assina e valida o payload', () => {
    const { token, expiresAt } = createQuotationLink('quotation-1', 'tenant-1');
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const payload = parseQuotationLink(token);
    expect(payload).toMatchObject({ q: 'quotation-1', t: 'tenant-1' });
  });

  it('recusa assinatura adulterada', () => {
    const { token } = createQuotationLink('quotation-1', 'tenant-1');
    const [payload = '', signature = ''] = token.split('.');
    const tampered = `${payload}.${signature.slice(0, -2)}xx`;
    expect(() => parseQuotationLink(tampered)).toThrow(InvalidPublicLinkError);
  });

  it('recusa token expirado', () => {
    const { token } = createQuotationLink('quotation-1', 'tenant-1', -60);
    expect(() => parseQuotationLink(token)).toThrow(/expirou/);
  });

  it('recusa token sem assinatura', () => {
    expect(() => parseQuotationLink('abc')).toThrow(InvalidPublicLinkError);
  });
});

describe('link público do orçamento', () => {
  it('abre o orçamento e registra a aprovação de forma idempotente', async () => {
    const t = await createTestTenant();
    const branch = (await t.run(() => listBranches()))[0]!;

    const customer = await t.run(() => createCustomer({ name: 'Cliente Link' }));
    const vehicle = await t.run(() =>
      createVehicle({ customerId: customer.id, plate: 'LNK0001' }),
    );
    const job = await t.run(() =>
      createJobCard(
        {
          branchId: branch.id,
          type: 'REPAIR',
          customerId: customer.id,
          vehicleId: vehicle.id,
        },
        t.userId,
      ),
    );
    await t.run(() =>
      addJobLine(job.id, {
        type: 'SERVICE',
        description: 'Serviço do link',
        quantity: 1,
        unitPrice: 150,
      }),
    );

    const quotation = await t.run(() =>
      createQuotation(
        {
          branchId: branch.id,
          customerId: customer.id,
          jobCardId: job.id,
          copyFromJobCard: true,
        },
        t.userId,
      ),
    );
    await t.run(() => sendQuotation(quotation.id));

    const { token } = createQuotationLink(quotation.id, t.tenantId);
    const publicView = await getPublicQuotation(token);
    expect(publicView.number).toBe(quotation.number);
    expect(Number(publicView.total)).toBe(150);
    expect(publicView.vehiclePlate).toBe('LNK0001');
    expect(publicView.tenantName).toContain('Oficina Teste');

    const approved = await decidePublicQuotation(token, 'approve');
    expect(approved.status).toBe('APPROVED');

    // Repetir a mesma decisão não é erro.
    const again = await decidePublicQuotation(token, 'approve');
    expect(again.status).toBe('APPROVED');

    // Decisão contrária a um orçamento fechado é recusada.
    await expect(decidePublicQuotation(token, 'reject')).rejects.toThrow();
  });

  it('recusa decisão em orçamento já faturado', async () => {
    const t = await createTestTenant();
    const branch = (await t.run(() => listBranches()))[0]!;
    const customer = await t.run(() => createCustomer({ name: 'Cliente Faturado' }));

    const quotation = await t.run(() =>
      createQuotation({ branchId: branch.id, customerId: customer.id }, t.userId),
    );
    await t.run(() => sendQuotation(quotation.id));
    await decidePublicQuotation(tokenFor(quotation.id, t.tenantId), 'approve');

    // Simula o faturamento sem depender do fluxo completo.
    await t.run(async () => {
      const { getDb } = await import('../src/server/db/prisma');
      await getDb().quotation.update({
        where: { id: quotation.id },
        data: { status: 'CONVERTED' },
      });
    });

    await expect(
      decidePublicQuotation(tokenFor(quotation.id, t.tenantId), 'reject'),
    ).rejects.toThrow(/não aceita mais decisão/);
  });
});

function tokenFor(quotationId: string, tenantId: string): string {
  return createQuotationLink(quotationId, tenantId).token;
}
