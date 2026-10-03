'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Invoice, Quotation } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorText,
  PageHeader,
  Spinner,
  Td,
  Th,
} from '@/components/ui';

export default function QuotationDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const quotation = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => apiFetch<Quotation>(`/quotations/${id}`),
    enabled: Boolean(id),
  });

  const action = useMutation({
    mutationFn: (path: string) => apiFetch(path, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const convert = useMutation({
    mutationFn: () => apiFetch<Invoice>(`/quotations/${id}/convert-to-invoice`, { method: 'POST' }),
    onSuccess: (invoice) => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      router.push(`/invoices/${invoice.id}`);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  if (quotation.isLoading) return <Spinner />;
  if (!quotation.data) return <EmptyState message="Orçamento não encontrado." />;

  const data = quotation.data;
  const canApprove = data.status === 'DRAFT' || data.status === 'SENT';

  return (
    <div>
      <PageHeader
        title={`Orçamento ${data.number}`}
        subtitle={data.customer?.name ?? ''}
        actions={<Badge>{data.status}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Itens</h2>
          {!data.lines || data.lines.length === 0 ? (
            <EmptyState message="Sem itens." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Tipo</Th>
                  <Th>Descrição</Th>
                  <Th className="text-right">Qtd</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((line) => (
                  <tr key={line.id} className="border-b border-slate-100">
                    <Td>{line.type}</Td>
                    <Td>{line.description ?? '-'}</Td>
                    <Td className="text-right">{String(line.quantity)}</Td>
                    <Td className="text-right">{formatMoney(line.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3 text-right text-sm text-slate-700">
            Total: <strong>{formatMoney(data.total)}</strong>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-800">Ações</h2>
          <ErrorText>{error}</ErrorText>
          <div className="mt-3 flex flex-col gap-2">
            {data.status === 'DRAFT' ? (
              <Button variant="secondary" onClick={() => action.mutate(`/quotations/${id}/send`)}>
                Marcar como enviado
              </Button>
            ) : null}
            {canApprove ? (
              <>
                <Button onClick={() => action.mutate(`/quotations/${id}/approve`)}>
                  Aprovar
                </Button>
                <Button variant="danger" onClick={() => action.mutate(`/quotations/${id}/reject`)}>
                  Rejeitar
                </Button>
              </>
            ) : null}
            {data.status === 'APPROVED' ? (
              <Button onClick={() => convert.mutate()} disabled={convert.isPending}>
                Gerar fatura
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
