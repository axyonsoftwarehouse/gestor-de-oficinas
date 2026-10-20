'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatDate, formatMoney } from '@/lib/format';
import { INVOICE_STATUS, enumOptions } from '@/lib/labels';
import type { Invoice } from '@/lib/types';
import { DataTable, usePagedQuery, type Column } from '@/components/data-table';
import { Card, PageHeader, Select, StatusBadge } from '@/components/ui';

const COLUMNS: Column<Invoice>[] = [
  {
    key: 'number',
    header: 'Número',
    cell: (invoice) => <span className="font-medium">{invoice.number}</span>,
  },
  { key: 'customer', header: 'Cliente', cell: (invoice) => invoice.customer?.name ?? '-' },
  { key: 'job', header: 'OS', cell: (invoice) => invoice.jobCard?.number ?? '-' },
  { key: 'issued', header: 'Emissão', cell: (invoice) => formatDate(invoice.issueDate) },
  {
    key: 'status',
    header: 'Status',
    cell: (invoice) => <StatusBadge map={INVOICE_STATUS} value={invoice.status} />,
  },
  { key: 'total', header: 'Total', align: 'right', cell: (invoice) => formatMoney(invoice.total) },
  {
    key: 'paid',
    header: 'Pago',
    align: 'right',
    cell: (invoice) => formatMoney(invoice.amountPaid),
  },
];

export default function InvoicesPage(): JSX.Element {
  const router = useRouter();
  const [status, setStatus] = useState('');

  const { query, page, setPage } = usePagedQuery<Invoice>('invoices', '/invoices', { status });
  const openDetail = (invoice: Invoice) => router.push(`/invoices/${invoice.id}`);

  return (
    <div>
      <PageHeader title="Faturas" subtitle="Faturamento e recebimentos" />

      <Card className="p-4">
        <div className="mb-3 w-full sm:max-w-xs">
          <Select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {enumOptions(INVOICE_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(invoice) => invoice.id}
          page={page}
          onPageChange={setPage}
          onRowClick={openDetail}
          rowActions={(invoice) => [{ label: 'Abrir', onSelect: () => openDetail(invoice) }]}
          emptyMessage={
            status
              ? 'Nenhuma fatura com esse status.'
              : 'Nenhuma fatura ainda. As faturas são geradas a partir de OS ou orçamentos aprovados.'
          }
        />
      </Card>
    </div>
  );
}
