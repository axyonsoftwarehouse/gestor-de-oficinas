'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Quotation } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
  Td,
  Th,
} from '@/components/ui';

export default function QuotationsPage(): JSX.Element {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['quotations', status],
    queryFn: () =>
      apiFetch<Paginated<Quotation>>(`/quotations${buildQuery({ status, pageSize: 50 })}`),
  });

  return (
    <div>
      <PageHeader title="Orçamentos" subtitle="Propostas comerciais" />

      <Card className="p-4">
        <div className="mb-3 max-w-xs">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="SENT">Enviado</option>
            <option value="APPROVED">Aprovado</option>
            <option value="REJECTED">Rejeitado</option>
            <option value="CONVERTED">Faturado</option>
          </Select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhum orçamento encontrado." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Número</Th>
                <Th>Cliente</Th>
                <Th>OS</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((quotation) => (
                <tr key={quotation.id} className="border-b border-slate-100">
                  <Td>{quotation.number}</Td>
                  <Td>{quotation.customer?.name ?? '-'}</Td>
                  <Td>{quotation.jobCard?.number ?? '-'}</Td>
                  <Td><Badge>{quotation.status}</Badge></Td>
                  <Td className="text-right">{formatMoney(quotation.total)}</Td>
                  <Td className="text-right">
                    <Link href={`/quotations/${quotation.id}`} className="text-sm underline">
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
