'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Invoice, Paginated } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import {
  Card,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
  Td,
  Th,
  StatusBadge,
} from '@/components/ui';
import { INVOICE_STATUS } from '@/lib/labels';

export default function InvoicesPage(): JSX.Element {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', status],
    queryFn: () =>
      apiFetch<Paginated<Invoice>>(`/invoices${buildQuery({ status, pageSize: 50 })}`),
  });

  return (
    <div>
      <PageHeader title="Faturas" subtitle="Faturamento e recebimentos" />

      <Card className="p-4">
        <div className="mb-3 max-w-xs">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="ISSUED">Emitida</option>
            <option value="PARTIALLY_PAID">Parcialmente paga</option>
            <option value="PAID">Paga</option>
            <option value="CANCELLED">Cancelada</option>
          </Select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhuma fatura encontrada." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Número</Th>
                <Th>Cliente</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Pago</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-100">
                  <Td>{invoice.number}</Td>
                  <Td>{invoice.customer?.name ?? '-'}</Td>
                  <Td><StatusBadge map={INVOICE_STATUS} value={invoice.status} /></Td>
                  <Td className="text-right">{formatMoney(invoice.total)}</Td>
                  <Td className="text-right">{formatMoney(invoice.amountPaid)}</Td>
                  <Td className="text-right">
                    <Link href={`/invoices/${invoice.id}`} className="text-sm underline">
                      Abrir
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
