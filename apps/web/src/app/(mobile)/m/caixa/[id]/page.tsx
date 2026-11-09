'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { INVOICE_STATUS, enumLabel, enumTone } from '@/lib/labels';
import type { Invoice } from '@/lib/types';
import { Badge, QueryError, Spinner } from '@/components/ui';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

export default function ReceberPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const [methodId, setMethodId] = useState('');

  const invoiceQuery = useQuery({
    queryKey: ['m', 'invoice', id],
    queryFn: () => apiFetch<Invoice>(`/invoices/${id}`),
    enabled: Boolean(id),
  });

  const methodsQuery = useQuery({
    queryKey: ['m', 'payment-methods'],
    queryFn: () => apiFetch<PaymentMethod[]>('/payment-methods'),
  });

  const pay = useMutation({
    mutationFn: (amount: number) =>
      apiFetch(`/invoices/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount, methodId: methodId || undefined }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['m', 'invoices'] });
      void qc.invalidateQueries({ queryKey: ['m', 'invoice', id] });
      toast.success('Pagamento registrado');
      router.push('/m/caixa');
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Não foi possível receber'),
  });

  if (invoiceQuery.isLoading) return <Spinner />;
  if (!invoiceQuery.data) {
    return (
      <QueryError
        error={invoiceQuery.error}
        onRetry={() => void invoiceQuery.refetch()}
      />
    );
  }

  const invoice = invoiceQuery.data;
  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  const paid = balance <= 0.009;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-ink">Fatura {invoice.number}</h1>
          <Badge tone={enumTone(INVOICE_STATUS, invoice.status)}>
            {enumLabel(INVOICE_STATUS, invoice.status)}
          </Badge>
        </div>
        <p className="text-sm text-ink-muted">{invoice.customer?.name ?? 'Cliente'}</p>
      </header>

      <div className="rounded-2xl border border-surface-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-muted">Total</span>
          <span className="text-sm tabular-nums text-ink">{formatMoney(invoice.total)}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-sm text-ink-muted">Já pago</span>
          <span className="text-sm tabular-nums text-ink">{formatMoney(invoice.amountPaid)}</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-surface-line pt-3">
          <span className="text-sm font-medium text-ink">Saldo</span>
          <span className="text-2xl font-semibold tabular-nums text-ink">
            {formatMoney(balance)}
          </span>
        </div>
      </div>

      {paid ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-state-success/10 p-6 text-center">
          <CheckCircle2 size={28} className="text-state-success" />
          <p className="text-sm font-medium text-ink">Fatura quitada</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Forma de pagamento
            </h2>
            {methodsQuery.data?.length ? (
              methodsQuery.data.map((method) => {
                const active = methodId === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setMethodId(method.id)}
                    className={
                      active
                        ? 'flex h-12 w-full items-center justify-between rounded-xl border border-brand bg-brand-soft px-4 text-base font-medium text-ink'
                        : 'flex h-12 w-full items-center justify-between rounded-xl border border-surface-line bg-surface px-4 text-base text-ink'
                    }
                  >
                    <span>{method.name}</span>
                    <span
                      className={
                        active
                          ? 'h-4 w-4 rounded-full border-4 border-brand bg-surface'
                          : 'h-4 w-4 rounded-full border border-surface-line'
                      }
                    />
                  </button>
                );
              })
            ) : (
              <p className="rounded-xl border border-dashed border-surface-line p-4 text-sm text-ink-muted">
                Nenhuma forma de pagamento cadastrada. Cadastre no computador em Pagamentos.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={pay.isPending}
            onClick={() => pay.mutate(balance)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-state-success text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
          >
            {pay.isPending ? 'Recebendo…' : `Receber ${formatMoney(balance)}`}
          </button>
        </>
      )}

      <a
        href={`/api/invoices/${id}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="block rounded-xl border border-surface-line bg-surface py-3 text-center text-sm font-medium text-brand"
      >
        Abrir fatura em PDF
      </a>
    </div>
  );
}
