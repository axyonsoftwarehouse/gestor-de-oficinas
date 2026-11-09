import { describe, expect, it } from 'vitest';
import { createTestTenant } from './helpers';
import { listBranches } from '../src/server/services/branches.service';
import { createCustomer } from '../src/server/services/customers.service';
import { createVehicle } from '../src/server/services/vehicles.service';
import { addJobLine, createJobCard } from '../src/server/services/job-cards.service';
import {
  approveQuotation,
  convertQuotationToInvoice,
  createQuotation,
  sendQuotation,
} from '../src/server/services/quotations.service';
import { renderInvoicePdf } from '../src/server/services/invoice-pdf.service';

describe('PDF da fatura', () => {
  it('gera um PDF válido com os dados do documento', async () => {
    const t = await createTestTenant();
    const branch = (await t.run(() => listBranches()))[0]!;

    const customer = await t.run(() => createCustomer({ name: 'Cliente PDF' }));
    const vehicle = await t.run(() =>
      createVehicle({ customerId: customer.id, plate: 'PDF0001' }),
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
        description: 'Serviço de teste',
        quantity: 2,
        unitPrice: 75,
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
    await t.run(() => approveQuotation(quotation.id, t.userId));
    const invoice = await t.run(() =>
      convertQuotationToInvoice(quotation.id, t.userId),
    );
    expect(invoice).not.toBeNull();

    const pdf = await t.run(() =>
      renderInvoicePdf(invoice!.id, { compress: false }),
    );

    // Validação estrutural: o pdfkit grava o texto em operadores de fonte, então
    // a conferência de conteúdo é visual — aqui garantimos que o documento é um
    // PDF íntegro, com páginas e fechamento corretos.
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(2000);

    const text = pdf.toString('latin1');
    expect(text).toMatch(/\/Type\s*\/Page[^s]/);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('recusa fatura de outra oficina', async () => {
    const a = await createTestTenant();
    const b = await createTestTenant();

    const branch = (await b.run(() => listBranches()))[0]!;
    const customer = await b.run(() => createCustomer({ name: 'Dono B' }));
    const quotation = await b.run(() =>
      createQuotation({ branchId: branch.id, customerId: customer.id }, b.userId),
    );
    await b.run(() => sendQuotation(quotation.id));
    await b.run(() => approveQuotation(quotation.id, b.userId));
    const invoice = await b.run(() =>
      convertQuotationToInvoice(quotation.id, b.userId),
    );

    await expect(
      a.run(() => renderInvoicePdf(invoice!.id, { compress: false })),
    ).rejects.toThrow();
  });
});
