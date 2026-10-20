'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, apiFetchText } from '@/lib/api';
import type { Invoice } from '@/lib/types';
import { formatMoney, formatDateTime } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  ErrorText,
  Field,
  Input,
  PageHeader,
  Spinner,
  Td,
  Th,
  StatusBadge,
} from '@/components/ui';
import { useConfirm } from '@/components/confirm';
import { INVOICE_STATUS, LINE_TYPE, enumLabel } from '@/lib/labels';

export default function InvoiceDetailPage(): JSX.Element {
  const confirm = useConfirm();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [payment, setPayment] = useState({ amount: '', methodId: '', reference: '' });

  const invoice = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => apiFetch<Invoice>(`/invoices/${id}`),
    enabled: Boolean(id),
  });

  const invalidate = (): void => {
    qc.invalidateQueries({ queryKey: ['invoice', id] });
    qc.invalidateQueries({ queryKey: ['invoices'] });
  };

  const addPayment = useMutation({
    mutationFn: async () => {
      await apiFetch(`/invoices/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(payment.amount),
          methodId: payment.methodId || undefined,
          reference: payment.reference || undefined,
        }),
      });
    },
    onSuccess: () => {
      invalidate();
      setPayment({ amount: '', methodId: '', reference: '' });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const issue = useMutation({
    mutationFn: () => apiFetch(`/invoices/${id}/issue`, { method: 'POST' }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const cancel = useMutation({
    mutationFn: () => apiFetch(`/invoices/${id}/cancel`, { method: 'POST' }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  async function openDocument(): Promise<void> {
    try {
      const html = await apiFetchText(`/invoices/${id}/document`);
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao abrir documento');
    }
  }

  if (invoice.isLoading) return <Spinner />;
  if (!invoice.data) return <EmptyState message="Fatura não encontrada." />;

  const data = invoice.data;
  const remaining = Number(data.total) - Number(data.amountPaid);

  return (
    <div>
      <PageHeader
        title={`Fatura ${data.number}`}
        subtitle={data.customer?.name ?? ''}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge map={INVOICE_STATUS} value={data.status} />
            <Button variant="secondary" onClick={openDocument}>
              Documento
            </Button>
            {data.status !== 'PAID' && data.status !== 'CANCELLED' ? (
              <Button
                variant="danger"
                disabled={cancel.isPending}
                onClick={async () => {
                  if (await confirm({ title: `Cancelar a fatura ${data.number}?`, confirmLabel: 'Cancelar', tone: 'danger' })) {
                    cancel.mutate();
                  }
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        }
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
                  <Th>Descrição</Th>
                  <Th className="text-right">Qtd</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((line) => (
                  <tr key={line.id} className="border-b border-slate-100">
                    <Td>{line.description ?? enumLabel(LINE_TYPE, line.type)}</Td>
                    <Td className="text-right">{String(line.quantity)}</Td>
                    <Td className="text-right">{formatMoney(line.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3 space-y-1 text-right text-sm">
            <div>Total: <strong>{formatMoney(data.total)}</strong></div>
            <div>Pago: {formatMoney(data.amountPaid)}</div>
            <div>Em aberto: {formatMoney(remaining)}</div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-800">Pagamentos</h2>
          <ErrorText>{error}</ErrorText>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {data.payments?.length ? (
              data.payments.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{formatDateTime(item.paidAt)}</span>
                  <span>{formatMoney(item.amount)}</span>
                </li>
              ))
            ) : (
              <li>Nenhum pagamento.</li>
            )}
          </ul>

          <div className="mt-4 space-y-3">
            <Field label="Valor">
              <Input
                type="number"
                value={payment.amount}
                onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
              />
            </Field>
            <Field label="Referência">
              <Input
                value={payment.reference}
                onChange={(e) => setPayment((p) => ({ ...p, reference: e.target.value }))}
              />
            </Field>
            <Button
              onClick={() => addPayment.mutate()}
              disabled={addPayment.isPending || !payment.amount}
              className="w-full"
            >
              Registrar pagamento
            </Button>
            {data.status === 'DRAFT' ? (
              <Button
                variant="secondary"
                onClick={() => issue.mutate()}
                disabled={issue.isPending}
                className="w-full"
              >
                Emitir fatura
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
