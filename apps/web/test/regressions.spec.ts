import { requireTenantId } from '@gestor/database';
import { describe, expect, it } from 'vitest';
import { getDb } from '../src/server/db/prisma';
import { CreateCustomerDto } from '../src/server/dtos/create-customer.dto';
import { UpdateCustomerDto } from '../src/server/dtos/update-customer.dto';
import { parseBody } from '../src/server/http/parse-body';
import { rateLimit } from '../src/server/http/rate-limit';
import { listBranches } from '../src/server/services/branches.service';
import { createCustomer } from '../src/server/services/customers.service';
import { createInvoiceFromJobCard, addInvoicePayment } from '../src/server/services/invoices.service';
import * as jobCards from '../src/server/services/job-cards.service';
import { createPart } from '../src/server/services/parts.service';
import { cancelPurchase, createPurchase } from '../src/server/services/purchases.service';
import * as quotations from '../src/server/services/quotations.service';
import { createRole } from '../src/server/services/roles.service';
import * as catalog from '../src/server/services/services.service';
import * as stock from '../src/server/services/stock.service';
import { createUser } from '../src/server/services/users.service';
import { createVehicle } from '../src/server/services/vehicles.service';
import { createTestTenant } from './helpers';

async function createJob(t: Awaited<ReturnType<typeof createTestTenant>>) {
  const branch = (await t.run(() => listBranches()))[0]!;
  const customer = await t.run(() => createCustomer({ name: `Cliente ${t.tenantId}` }));
  const vehicle = await t.run(() =>
    createVehicle({ customerId: customer.id, plate: `T${Date.now() % 100000}` }),
  );
  const job = await t.run(() =>
    jobCards.createJobCard(
      {
        branchId: branch.id,
        type: 'REPAIR',
        customerId: customer.id,
        vehicleId: vehicle.id,
      },
      t.userId,
    ),
  );
  return { branch, customer, vehicle, job };
}

function jsonRequest(method: string, body: unknown): Request {
  return new Request('http://localhost/api/test', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Regressões de backend', () => {
  it('não duplica o imposto no total da OS', async () => {
    const t = await createTestTenant();
    const { job } = await createJob(t);

    const tax = await t.run(() =>
      getDb().tax.create({
        data: { tenantId: requireTenantId(), name: 'IVA 10', rate: 10, type: 'PERCENT' },
      }),
    );

    await t.run(() =>
      jobCards.addJobLine(job.id, {
        type: 'SERVICE',
        description: 'Mão de obra',
        quantity: 1,
        unitPrice: 100,
        taxIds: [tax.id],
      }),
    );

    const detail = await t.run(() => jobCards.findJobCard(job.id));
    expect(Number(detail.subtotal)).toBe(100);
    expect(Number(detail.taxTotal)).toBe(10);
    expect(Number(detail.total)).toBe(110);
  });

  it('não permite faturar a mesma OS duas vezes', async () => {
    const t = await createTestTenant();
    const { job } = await createJob(t);
    await t.run(() =>
      jobCards.addJobLine(job.id, {
        type: 'SERVICE',
        description: 'Serviço',
        quantity: 1,
        unitPrice: 50,
      }),
    );

    const invoice = await t.run(() => createInvoiceFromJobCard(job.id, t.userId));
    expect(invoice.status).toBe('ISSUED');

    await expect(
      t.run(() => createInvoiceFromJobCard(job.id, t.userId)),
    ).rejects.toThrow();
  });

  it('rejeita desconto percentual acima de 100%', async () => {
    const t = await createTestTenant();
    const { job } = await createJob(t);

    await expect(
      t.run(() =>
        jobCards.addJobLine(job.id, {
          type: 'SERVICE',
          quantity: 1,
          unitPrice: 100,
          discountType: 'PERCENT',
          discountValue: 150,
        }),
      ),
    ).rejects.toThrow();
  });

  it('rejeita pagamento acima do saldo em aberto', async () => {
    const t = await createTestTenant();
    const { job } = await createJob(t);
    await t.run(() =>
      jobCards.addJobLine(job.id, {
        type: 'SERVICE',
        quantity: 1,
        unitPrice: 100,
      }),
    );

    const invoice = await t.run(() => createInvoiceFromJobCard(job.id, t.userId));

    await expect(
      t.run(() => addInvoicePayment(invoice.id, { amount: 150 }, t.userId)),
    ).rejects.toThrow();

    const paid = await t.run(() =>
      addInvoicePayment(invoice.id, { amount: 100 }, t.userId),
    );
    expect(paid.status).toBe('PAID');
  });

  it('impede saldo de estoque negativo', async () => {
    const t = await createTestTenant();
    const branch = (await t.run(() => listBranches()))[0]!;
    const part = await t.run(() =>
      createPart({ name: 'Peça Estoque', costPrice: 10, salePrice: 20, minStock: 0 }),
    );
    const location = await t.run(() =>
      stock.createLocation({ branchId: branch.id, name: 'Local Estoque' }),
    );

    await expect(
      t.run(() =>
        stock.createMovement(
          { locationId: location.id, partId: part.id, type: 'ADJUSTMENT', quantity: -5 },
          t.userId,
        ),
      ),
    ).rejects.toThrow();
  });

  it('impede conceder permissões que o ator não possui', async () => {
    const t = await createTestTenant();

    await expect(
      t.run(() =>
        createRole({ name: 'Escalada', permissionCodes: ['user.delete'] }, [
          'dashboard.view',
        ]),
      ),
    ).rejects.toThrow();

    const ok = await t.run(() =>
      createRole({ name: 'Papel OK', permissionCodes: ['dashboard.view'] }, ['*']),
    );
    expect(ok.permissions.length).toBe(1);
  });

  it('impede atribuir um papel com permissões acima das do ator', async () => {
    const t = await createTestTenant();
    const ownerRole = await t.run(() =>
      getDb().role.findFirstOrThrow({ where: { slug: 'owner' } }),
    );

    await expect(
      t.run(() =>
        createUser(
          {
            name: 'Novo',
            email: `novo.${Date.now()}@test.local`,
            password: 'senha12345',
            roleIds: [ownerRole.id],
          },
          ['user.create'],
        ),
      ),
    ).rejects.toThrow();
  });

  it('cancelar compra reverte a despesa e restaura o custo da peça', async () => {
    const t = await createTestTenant();
    const branch = (await t.run(() => listBranches()))[0]!;
    const part = await t.run(() =>
      createPart({ name: 'Peça Compra', costPrice: 20, salePrice: 40, minStock: 0 }),
    );
    const location = await t.run(() =>
      stock.createLocation({ branchId: branch.id, name: 'Local Compra' }),
    );

    const purchase = await t.run(() =>
      createPurchase(
        {
          branchId: branch.id,
          locationId: location.id,
          items: [{ partId: part.id, quantity: 5, unitCost: 30 }],
        },
        t.userId,
      ),
    );

    const afterCreate = await t.run(() =>
      getDb().partCatalog.findFirstOrThrow({ where: { id: part.id } }),
    );
    expect(Number(afterCreate.costPrice)).toBe(30);
    expect(
      await t.run(() => getDb().expense.count({ where: { purchaseId: purchase.id } })),
    ).toBe(1);

    await t.run(() => cancelPurchase(purchase.id));

    const afterCancel = await t.run(() =>
      getDb().partCatalog.findFirstOrThrow({ where: { id: part.id } }),
    );
    expect(Number(afterCancel.costPrice)).toBe(20);
    expect(
      await t.run(() => getDb().expense.count({ where: { purchaseId: purchase.id } })),
    ).toBe(0);
    const balances = await t.run(() => stock.listBalances({ partId: part.id }));
    expect(balances.length === 0 || Number(balances[0]!.quantity) === 0).toBe(true);
  });

  it('rejeita referência a cliente de outro tenant na OS', async () => {
    const a = await createTestTenant();
    const b = await createTestTenant();

    const customerA = await a.run(() => createCustomer({ name: 'Cliente A' }));
    const branchB = (await b.run(() => listBranches()))[0]!;
    const customerB = await b.run(() => createCustomer({ name: 'Cliente B' }));
    const vehicleB = await b.run(() =>
      createVehicle({ customerId: customerB.id, plate: 'XB0001' }),
    );

    await expect(
      b.run(() =>
        jobCards.createJobCard(
          {
            branchId: branchB.id,
            type: 'REPAIR',
            customerId: customerA.id,
            vehicleId: vehicleB.id,
          },
          b.userId,
        ),
      ),
    ).rejects.toThrow();
  });

  it('rate limit bloqueia após exceder o limite', () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    expect(() => rateLimit(key, 2, 60_000)).toThrow();
  });

  it('PATCH aceita corpo parcial (campos ausentes não são exigidos)', async () => {
    const dto = await parseBody(
      jsonRequest('PATCH', { phone: '11999999999' }),
      UpdateCustomerDto,
    );
    expect(dto.phone).toBe('11999999999');
  });

  it('POST continua exigindo campos obrigatórios', async () => {
    await expect(
      parseBody(jsonRequest('POST', { phone: '11999999999' }), CreateCustomerDto),
    ).rejects.toThrow();
  });

  it('catálogo de serviços: cria, lista, atualiza e remove (soft delete)', async () => {
    const t = await createTestTenant();

    const created = await t.run(() =>
      catalog.createService({ name: 'Alinhamento', code: 'SRV-1', basePrice: 120 }),
    );
    expect(Number(created.basePrice)).toBe(120);

    const listed = await t.run(() => catalog.listServices({ search: 'Alinha' }));
    expect(listed.items.some((item) => item.id === created.id)).toBe(true);

    const updated = await t.run(() =>
      catalog.updateService(created.id, { basePrice: 150 }),
    );
    expect(Number(updated.basePrice)).toBe(150);

    await t.run(() => catalog.removeService(created.id));
    await expect(t.run(() => catalog.findService(created.id))).rejects.toThrow();
  });

  it('lança item de OS vinculado a um serviço do catálogo', async () => {
    const t = await createTestTenant();
    const { job } = await createJob(t);
    const service = await t.run(() =>
      catalog.createService({ name: 'Troca de óleo', basePrice: 80 }),
    );

    await t.run(() =>
      jobCards.addJobLine(job.id, {
        type: 'SERVICE',
        serviceId: service.id,
        description: service.name,
        quantity: 1,
        unitPrice: Number(service.basePrice),
      }),
    );

    const detail = await t.run(() => jobCards.findJobCard(job.id));
    expect(detail.lines?.[0]?.description).toBe('Troca de óleo');
  });

  it('não permite alterar itens de orçamento aprovado', async () => {
    const t = await createTestTenant();
    const branch = (await t.run(() => listBranches()))[0]!;
    const customer = await t.run(() => createCustomer({ name: 'Cliente Orçamento' }));

    const quotation = await t.run(() =>
      quotations.createQuotation(
        { branchId: branch.id, customerId: customer.id },
        t.userId,
      ),
    );
    await t.run(() =>
      quotations.addQuotationLine(quotation.id, {
        type: 'SERVICE',
        quantity: 1,
        unitPrice: 10,
      }),
    );
    await t.run(() => quotations.approveQuotation(quotation.id, t.userId));

    await expect(
      t.run(() =>
        quotations.addQuotationLine(quotation.id, {
          type: 'SERVICE',
          quantity: 1,
          unitPrice: 10,
        }),
      ),
    ).rejects.toThrow();
  });
});
