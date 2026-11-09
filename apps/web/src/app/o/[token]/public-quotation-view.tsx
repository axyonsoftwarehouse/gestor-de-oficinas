'use client';

import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { PublicQuotation } from '@/server/services/public-quotations.service';
import { formatDate, formatMoney } from '@/lib/format';
import type { Tone } from '@/lib/labels';
import { Badge, cn } from '@/components/ui';

type Decision = 'approve' | 'reject';

const FINAL: Record<string, { label: string; tone: Tone; text: string }> = {
  APPROVED: {
    label: 'Aprovado',
    tone: 'green',
    text: 'Você aprovou este orçamento. A oficina já foi avisada e dará sequência ao serviço.',
  },
  REJECTED: {
    label: 'Recusado',
    tone: 'red',
    text: 'Você recusou este orçamento. Se mudou de ideia, fale com a oficina.',
  },
  CONVERTED: {
    label: 'Faturado',
    tone: 'green',
    text: 'Este orçamento já virou uma fatura.',
  },
};

export function PublicQuotationView({
  data,
  token,
}: {
  data: PublicQuotation;
  token: string;
}): JSX.Element {
  const [status, setStatus] = useState(data.status);
  const [pending, setPending] = useState<Decision | null>(null);
  const [error, setError] = useState('');

  const open = status === 'DRAFT' || status === 'SENT';
  const final = FINAL[status];

  async function decide(decision: Decision): Promise<void> {
    setPending(decision);
    setError('');
    try {
      const response = await fetch(`/api/public/quotations/${token}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        status?: string;
      };
      if (!response.ok) throw new Error(body.message ?? 'Não foi possível registrar sua resposta.');
      setStatus((body.status as PublicQuotation['status']) ?? (decision === 'approve' ? 'APPROVED' : 'REJECTED'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar sua resposta.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6">
        <header className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <ShieldCheck size={18} />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-ink">{data.tenantName}</div>
            <div className="text-[11px] uppercase tracking-wider text-ink-soft">
              Orçamento {data.number}
            </div>
          </div>
        </header>

        <div className="mt-6 rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-2xl font-semibold uppercase tracking-wide text-ink">
                {data.vehiclePlate ?? 'Veículo'}
              </div>
              <div className="mt-0.5 text-sm text-ink-muted">
                {data.vehicleLabel ?? ''}
                {data.jobNumber ? ` · OS ${data.jobNumber}` : ''}
              </div>
            </div>
            <Badge tone={final ? final.tone : 'amber'}>
              {final?.label ?? (status === 'SENT' ? 'Aguardando' : 'Em elaboração')}
            </Badge>
          </div>

          <div className="mt-5 space-y-2">
            {data.lines.map((line) => (
              <div
                key={line.id}
                className="flex items-start justify-between gap-3 border-b border-surface-line/70 pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-sm text-ink">{line.description ?? 'Serviço'}</div>
                  <div className="text-xs text-ink-soft">{Number(line.quantity)}x</div>
                </div>
                <div className="shrink-0 text-sm font-medium tabular-nums text-ink">
                  {formatMoney(line.total)}
                </div>
              </div>
            ))}
            {data.lines.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhum item lançado.</p>
            ) : null}
          </div>

          <div className="mt-4 border-t border-surface-line pt-3">
            {Number(data.taxTotal) > 0 ? (
              <div className="flex items-baseline justify-between text-sm text-ink-muted">
                <span>Impostos</span>
                <span className="tabular-nums">{formatMoney(data.taxTotal)}</span>
              </div>
            ) : null}
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink">Total</span>
              <span className="text-2xl font-semibold tabular-nums text-ink">
                {formatMoney(data.total)}
              </span>
            </div>
          </div>

          {data.validUntil ? (
            <p className="mt-3 text-xs text-ink-soft">
              Válido até {formatDate(data.validUntil)}
            </p>
          ) : null}
          {data.notes ? (
            <p className="mt-2 rounded-lg bg-surface-soft p-3 text-xs text-ink-muted">
              {data.notes}
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-state-danger/10 p-3 text-sm text-state-danger">
            {error}
          </p>
        ) : null}

        {open ? (
          <div className="mt-5 space-y-2">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void decide('approve')}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-state-success text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
            >
              <CheckCircle2 size={20} />
              {pending === 'approve' ? 'Registrando…' : 'Aprovar orçamento'}
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void decide('reject')}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-surface-line bg-surface text-sm font-medium text-ink transition active:scale-[0.99] disabled:opacity-50',
              )}
            >
              <XCircle size={18} className="text-ink-muted" />
              {pending === 'reject' ? 'Registrando…' : 'Recusar'}
            </button>
          </div>
        ) : final ? (
          <div className="mt-5 rounded-2xl border border-surface-line bg-surface p-5 text-center">
            <CheckCircle2 size={30} className="mx-auto text-state-success" />
            <p className="mt-2 text-base font-semibold text-ink">{final.text}</p>
          </div>
        ) : null}

        <p className="mt-auto pt-8 text-center text-xs text-ink-soft">
          Link pessoal e temporário. Em caso de dúvida, fale com a oficina.
        </p>
      </div>
    </div>
  );
}
