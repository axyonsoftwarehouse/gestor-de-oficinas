import 'server-only';
import PDFDocument from 'pdfkit';
import { requireTenantId } from '@gestor/database';
import { enumLabel, INVOICE_STATUS } from '../../lib/labels';
import { getDb } from '../db/prisma';
import { findInvoice } from './invoices.service';

/**
 * Gera o PDF da fatura sem navegador (pdfkit).
 *
 * O HTML (`GET /api/invoices/:id/document`) continua servindo a visualização;
 * este renderizador produz o documento formal, com paginação e totais.
 */

const PAGE = { width: 595.28, height: 841.89, margin: 48 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

const COLORS = {
  ink: '#0f172a',
  muted: '#64748b',
  soft: '#f6f7fb',
  line: '#e2e8f0',
  brand: '#2f80ed',
  success: '#12b76a',
};

const COLUMNS = {
  description: { x: 48, width: 268 },
  quantity: { x: 330, width: 48 },
  unitPrice: { x: 392, width: 86 },
  total: { x: 486, width: 61 },
};

export interface InvoicePdfOptions {
  /** Desliga a compressão (usado em testes para inspecionar o texto). */
  compress?: boolean;
}

function formatMoney(value: unknown, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
  }).format(Number(value ?? 0));
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('pt-BR');
}

export async function renderInvoicePdf(
  id: string,
  options: InvoicePdfOptions = {},
): Promise<Buffer> {
  const invoice = await findInvoice(id);
  const tenant = await getDb().tenant.findUnique({
    where: { id: requireTenantId() },
    select: { name: true },
  });

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE.margin,
    bufferPages: true,
    compress: options.compress ?? true,
    info: {
      Title: `Fatura ${invoice.number}`,
      Author: tenant?.name ?? 'Gestor de Oficinas',
      Subject: 'Fatura de serviço',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const currency = invoice.currency || 'BRL';
  const money = (value: unknown): string => formatMoney(value, currency);

  let y = drawHeader(doc, invoice.number, tenant?.name ?? 'Oficina');
  y = drawParties(doc, invoice, y);
  y = drawItems(doc, invoice, y, money);
  y = drawTotals(doc, invoice, y, money);
  if (invoice.payments.length > 0) {
    y = drawPayments(doc, invoice, y, money);
  }
  drawFooter(doc, invoice.number);

  doc.end();
  return finished;
}

type Doc = InstanceType<typeof PDFDocument>;
type Invoice = Awaited<ReturnType<typeof findInvoice>>;

function drawHeader(doc: Doc, number: string, tenantName: string): number {
  const top = PAGE.margin;

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(COLORS.ink)
    .text(tenantName, PAGE.margin, top, { width: 300 });

  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(COLORS.brand)
    .text('FATURA', PAGE.margin, top, { width: CONTENT_WIDTH, align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(`Nº ${number}`, PAGE.margin, top + 30, {
      width: CONTENT_WIDTH,
      align: 'right',
    });

  const lineY = top + 58;
  doc
    .moveTo(PAGE.margin, lineY)
    .lineTo(PAGE.margin + CONTENT_WIDTH, lineY)
    .strokeColor(COLORS.line)
    .lineWidth(1)
    .stroke();

  return lineY + 18;
}

function drawParties(doc: Doc, invoice: Invoice, startY: number): number {
  let y = startY;
  const vehicle = invoice.jobCard?.vehicle;
  const vehicleLabel = [vehicle?.brand?.name, vehicle?.model?.name]
    .filter(Boolean)
    .join(' ');

  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted).text('CLIENTE', PAGE.margin, y);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted).text('VEÍCULO', 330, y);

  y += 12;
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.ink).text(
    invoice.customer?.name ?? '-',
    PAGE.margin,
    y,
    { width: 250 },
  );
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.ink).text(
    vehicle?.plate ? `${vehicle.plate}${vehicleLabel ? ` · ${vehicleLabel}` : ''}` : '-',
    330,
    y,
    { width: 217 },
  );

  y += 16;
  const document = invoice.customer?.document
    ? `Documento: ${invoice.customer.document}`
    : `Emitida em ${formatDate(invoice.issueDate)}`;
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(document, PAGE.margin, y, {
    width: 250,
  });
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(
    `OS ${invoice.jobCard?.number ?? '-'}`,
    330,
    y,
    { width: 217 },
  );

  y += 14;
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(
    `Status: ${enumLabel(INVOICE_STATUS, invoice.status)}`,
    PAGE.margin,
    y,
    { width: 250 },
  );

  return y + 24;
}

function drawTableHeader(doc: Doc, y: number): number {
  doc.rect(PAGE.margin, y, CONTENT_WIDTH, 20).fill(COLORS.soft);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted);
  doc.text('DESCRIÇÃO', COLUMNS.description.x + 4, y + 6, {
    width: COLUMNS.description.width,
  });
  doc.text('QTD', COLUMNS.quantity.x, y + 6, {
    width: COLUMNS.quantity.width,
    align: 'right',
  });
  doc.text('UNITÁRIO', COLUMNS.unitPrice.x, y + 6, {
    width: COLUMNS.unitPrice.width,
    align: 'right',
  });
  doc.text('TOTAL', COLUMNS.total.x, y + 6, {
    width: COLUMNS.total.width,
    align: 'right',
  });
  return y + 20;
}

function drawItems(
  doc: Doc,
  invoice: Invoice,
  startY: number,
  money: (value: unknown) => string,
): number {
  let y = drawTableHeader(doc, startY);

  for (const line of invoice.lines) {
    const description = line.description ?? line.type;
    doc.font('Helvetica').fontSize(9);
    const height = Math.max(
      20,
      doc.heightOfString(description, { width: COLUMNS.description.width - 8 }) + 10,
    );

    const bottomLimit = PAGE.height - 90;
    if (y + height > bottomLimit) {
      doc.addPage();
      y = drawTableHeader(doc, PAGE.margin);
    }

    doc.fillColor(COLORS.ink);
    doc.text(description, COLUMNS.description.x + 4, y + 5, {
      width: COLUMNS.description.width - 8,
    });
    doc.text(String(Number(line.quantity)), COLUMNS.quantity.x, y + 5, {
      width: COLUMNS.quantity.width,
      align: 'right',
    });
    doc.text(money(line.unitPrice), COLUMNS.unitPrice.x, y + 5, {
      width: COLUMNS.unitPrice.width,
      align: 'right',
    });
    doc.text(money(line.total), COLUMNS.total.x, y + 5, {
      width: COLUMNS.total.width,
      align: 'right',
    });

    y += height;
    doc
      .moveTo(PAGE.margin, y)
      .lineTo(PAGE.margin + CONTENT_WIDTH, y)
      .strokeColor(COLORS.line)
      .lineWidth(0.5)
      .stroke();
  }

  return y + 16;
}

function drawTotals(
  doc: Doc,
  invoice: Invoice,
  startY: number,
  money: (value: unknown) => string,
): number {
  let y = startY;
  const labelX = 330;
  const valueX = 470;
  const valueWidth = 77;

  const row = (label: string, value: string, bold = false): void => {
    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 11 : 9)
      .fillColor(bold ? COLORS.ink : COLORS.muted)
      .text(label, labelX, y, { width: 130 });
    doc.text(value, valueX, y, {
      width: valueWidth,
      align: 'right',
    });
    y += bold ? 20 : 15;
  };

  row('Subtotal', money(invoice.subtotal));
  row('Descontos', `- ${money(invoice.discountTotal)}`);
  row('Impostos', money(invoice.taxTotal));

  doc
    .moveTo(labelX, y)
    .lineTo(valueX + valueWidth, y)
    .strokeColor(COLORS.line)
    .lineWidth(1)
    .stroke();
  y += 6;

  row('Total', money(invoice.total), true);
  row('Pago', money(invoice.amountPaid));

  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  row('Saldo', money(balance), true);

  return y;
}

function drawPayments(
  doc: Doc,
  invoice: Invoice,
  startY: number,
  money: (value: unknown) => string,
): number {
  let y = startY + 6;

  if (y > PAGE.height - 140) {
    doc.addPage();
    y = PAGE.margin;
  }

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.ink).text('Pagamentos', PAGE.margin, y);
  y += 14;

  for (const payment of invoice.payments) {
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted);
    doc.text(formatDate(payment.paidAt), PAGE.margin, y, { width: 70 });
    doc.text(payment.method?.name ?? '-', PAGE.margin + 76, y, { width: 120 });
    doc.text(payment.reference ?? '-', PAGE.margin + 200, y, { width: 190 });
    doc.fillColor(COLORS.ink).text(money(payment.amount), PAGE.margin + 400, y, {
      width: 99,
      align: 'right',
    });
    y += 14;
  }

  return y;
}

function drawFooter(doc: Doc, number: string): void {
  const range = doc.bufferedPageRange();
  const generatedAt = new Date().toLocaleString('pt-BR');

  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(range.start + index);
    const footerY = PAGE.height - 40;

    doc
      .moveTo(PAGE.margin, footerY - 12)
      .lineTo(PAGE.margin + CONTENT_WIDTH, footerY - 12)
      .strokeColor(COLORS.line)
      .lineWidth(0.5)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(COLORS.muted)
      .text(`Fatura ${number} · gerado em ${generatedAt}`, PAGE.margin, footerY, {
        width: CONTENT_WIDTH - 80,
        lineBreak: false,
      });

    doc.text(`Página ${index + 1} de ${range.count}`, PAGE.margin + CONTENT_WIDTH - 80, footerY, {
      width: 80,
      align: 'right',
      lineBreak: false,
    });
  }
}
