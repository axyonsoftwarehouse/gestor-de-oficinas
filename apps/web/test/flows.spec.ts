import { describe, expect, it } from 'vitest';
import { listBranches } from '../src/server/services/branches.service';
import { createCustomer } from '../src/server/services/customers.service';
import { createVehicle } from '../src/server/services/vehicles.service';
import { createPart } from '../src/server/services/parts.service';
import * as jobCards from '../src/server/services/job-cards.service';
import * as quotations from '../src/server/services/quotations.service';
import * as invoices from '../src/server/services/invoices.service';
import * as stock from '../src/server/services/stock.service';
import { createTestTenant } from './helpers';

describe('Fluxo operação → orçamento → fatura → pagamento → estoque', () => {
  it('executa o ciclo completo', async () => {
    const t = await createTestTenant();

    const branch = (await t.run(() => listBranches()))[0];
    expect(branch).toBeDefined();

    const customer = await t.run(() => createCustomer({ name: 'Cliente Fluxo' }));
    const vehicle = await t.run(() =>
      createVehicle({ customerId: customer.id, plate: 'FLW0001' }),
    );

    const job = await t.run(() =>
      jobCards.createJobCard(
        {
          branchId: branch!.id,
          type: 'REPAIR',
          customerId: customer.id,
          vehicleId: vehicle.id,
        },
        t.userId,
      ),
    );
    expect(job.status).toBe('DRAFT');

    await t.run(() =>
      jobCards.addJobLine(job.id, {
        type: 'SERVICE',
        description: 'Mão de obra',
        quantity: 1,
        unitPrice: 100,
      }),
    );
    const detail = await t.run(() => jobCards.findJobCard(job.id));
    expect(Number(detail.total)).toBe(100);

    const scheduled = await t.run(() =>
      jobCards.transitionJobCard(job.id, { status: 'SCHEDULED' }, t.userId),
    );
    expect(scheduled.status).toBe('SCHEDULED');

    const quotation = await t.run(() =>
      quotations.createQuotation(
        {
          branchId: branch!.id,
          customerId: customer.id,
          jobCardId: job.id,
          copyFromJobCard: true,
        },
        t.userId,
      ),
    );
    expect(quotation.lines.length).toBeGreaterThan(0);

    await t.run(() => quotations.sendQuotation(quotation.id));
    await t.run(() => quotations.approveQuotation(quotation.id, t.userId));

    const invoice = await t.run(() =>
      quotations.convertQuotationToInvoice(quotation.id, t.userId),
    );
    expect(invoice?.status).toBe('ISSUED');
    expect(Number(invoice?.total)).toBe(100);

    const partial = await t.run(() =>
      invoices.addInvoicePayment(invoice!.id, { amount: 40 }, t.userId),
    );
    expect(partial.status).toBe('PARTIALLY_PAID');

    const paid = await t.run(() =>
      invoices.addInvoicePayment(invoice!.id, { amount: 60 }, t.userId),
    );
    expect(paid.status).toBe('PAID');
    expect(Number(paid.amountPaid)).toBe(100);

    const part = await t.run(() =>
      createPart({ name: 'Peça Fluxo', costPrice: 20, salePrice: 50, minStock: 1 }),
    );
    const location = await t.run(() =>
      stock.createLocation({ branchId: branch!.id, name: 'Local Fluxo' }),
    );

    const movement = await t.run(() =>
      stock.createMovement(
        {
          locationId: location.id,
          partId: part.id,
          type: 'PURCHASE',
          quantity: 10,
          unitCost: 20,
        },
        t.userId,
      ),
    );
    expect(Number(movement.balance.quantity)).toBe(10);

    const issue = await t.run(() =>
      stock.issueToJob(
        { jobCardId: job.id, locationId: location.id, partId: part.id, quantity: 2 },
        t.userId,
      ),
    );
    expect(Number(issue.balance.quantity)).toBe(8);

    const finalJob = await t.run(() => jobCards.findJobCard(job.id));
    expect(finalJob.lines.length).toBe(2);
  });
});
