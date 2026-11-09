'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Wallet } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { INVOICE_STATUS, enumLabel, enumTone } from '@/lib/labels';
import type { Invoice, Paginated } from '@/lib/types';
import { Badge, QueryError, Spinner } from '@/components/ui';

const OPEN = ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'];

export default function CaixaPage(): JSX.Element {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['m', 'invoices'],
    queryFn: () => apiFetch<Paginated<Invoice>>('/invoices?pageSize=50'),
  });

  const open = (data?.items ?? []).filter((invoice) => OPEN.includes(invoice.status));
  const receivable = open.reduce(
    (sum, invoice) => sum + (Number(invoice.total) - Number(invoice.amountPaid)),
    0,
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Caixa</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {open.length === 0
            ? 'Nada a receber agora.'
            : `${open.length} ${open.length === 1 ? 'cobrança' : 'cobranças'} em aberto`}
        </p>
      </header>

      {open.length > 0 ? (
        <div className="rounded-2xl bg-brand p-4 text-white">
          <div className="text-xs font-medium uppercase tracking-wider text-white/70">
            A receber
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            {formatMoney(receivable)}
          </div>
        </div>
      ) : null}

      {isLoading ? <Spinner /> : null}
      {isError ? <QueryError error={error} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && open.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-8 text-center">
          <Wallet size={28} className="mx-auto text-ink-soft" />
          <p className="mt-3 text-sm font-medium text-ink">Nenhuma cobrança em aberto</p>
          <p className="mt-1 text-sm text-ink-muted">
            Feche uma OS na aba <span className="font-semibold text-brand">Hoje</span> e ela
            aparece aqui.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        {open.map((invoice) => {
          const balance = Number(invoice.total) - Number(invoice.amountPaid);
          return (
            <Link
              key={invoice.id}
              href={`/m/caixa/${invoice.id}`}
              className="block rounded-2xl border border-surface-line bg-surface p-4 shadow-card transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">
                    {invoice.customer?.name ?? 'Cliente'}
                  </div>
                  <div className="text-xs text-ink-soft">
                    Fatura {invoice.number}
                    {invoice.jobCard ? ` · OS ${invoice.jobCard.number}` : ''}
                  </div>
                </div>
                <Badge tone={enumTone(INVOICE_STATUS, invoice.status)}>
                  {enumLabel(INVOICE_STATUS, invoice.status)}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-surface-line pt-3">
                <span className="text-xs text-ink-soft">Saldo</span>
                <span className="flex items-center gap-1 text-base font-semibold tabular-nums text-ink">
                  {formatMoney(balance)}
                  <ChevronRight size={16} className="text-ink-soft" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
