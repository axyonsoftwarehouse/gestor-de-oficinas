'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CircleDollarSign, Copy, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { JOB_STATUS, LINE_TYPE, enumLabel, enumTone } from '@/lib/labels';
import type { JobCard, JobStatus, Paginated, Quotation } from '@/lib/types';
import { Badge, QueryError, Spinner } from '@/components/ui';

interface Action {
  label: string;
  status: JobStatus;
  secondary?: boolean;
}

const ACTIONS: Partial<Record<JobStatus, Action[]>> = {
  DRAFT: [
    { label: 'Receber veículo', status: 'CHECKED_IN' },
    { label: 'Iniciar serviço', status: 'IN_PROGRESS' },
  ],
  SCHEDULED: [{ label: 'Receber veículo', status: 'CHECKED_IN' }],
  CHECKED_IN: [
    { label: 'Iniciar serviço', status: 'IN_PROGRESS' },
    { label: 'Pedir aprovação', status: 'WAITING_APPROVAL', secondary: true },
  ],
  IN_INSPECTION: [{ label: 'Iniciar serviço', status: 'IN_PROGRESS' }],
  WAITING_APPROVAL: [{ label: 'Aprovar orçamento', status: 'APPROVED' }],
  APPROVED: [{ label: 'Iniciar serviço', status: 'IN_PROGRESS' }],
  IN_PROGRESS: [
    { label: 'Concluir serviço', status: 'COMPLETED' },
    { label: 'Aguardando peça', status: 'WAITING_PARTS', secondary: true },
  ],
  WAITING_PARTS: [{ label: 'Retomar serviço', status: 'IN_PROGRESS' }],
  COMPLETED: [{ label: 'Entregar veículo', status: 'DELIVERED' }],
};

export default function OsPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const { data: job, isLoading, error, refetch } = useQuery({
    queryKey: ['m', 'job', id],
    queryFn: () => apiFetch<JobCard>(`/job-cards/${id}`),
    enabled: Boolean(id),
  });

  const transition = useMutation({
    mutationFn: (status: JobStatus) =>
      apiFetch(`/job-cards/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, status) => {
      void qc.invalidateQueries({ queryKey: ['m', 'job', id] });
      void qc.invalidateQueries({ queryKey: ['m', 'job-cards'] });
      toast.success(enumLabel(JOB_STATUS, status));
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Não foi possível mudar o status'),
  });

  const invoice = useMutation({
    mutationFn: () => apiFetch<{ id: string }>(`/invoices/from-job/${id}`, { method: 'POST' }),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: ['m', 'invoices'] });
      router.push(`/m/caixa/${created.id}`);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Não foi possível faturar'),
  });

  const sendQuotationLink = useMutation({
    mutationFn: async () => {
      const page = await apiFetch<Paginated<Quotation>>(
        `/quotations?jobCardId=${id}&pageSize=10`,
      );
      const existing = page.items.find((item) => ['DRAFT', 'SENT'].includes(item.status));
      let quotationId = existing?.id;

      if (!quotationId) {
        if (!job?.branch?.id || !job?.customerId) {
          throw new Error('A OS precisa de filial e cliente para gerar o orçamento.');
        }
        const created = await apiFetch<Quotation>('/quotations', {
          method: 'POST',
          body: JSON.stringify({
            branchId: job.branch.id,
            customerId: job.customerId,
            jobCardId: id,
            copyFromJobCard: true,
          }),
        });
        quotationId = created.id;
      }

      return apiFetch<{ publicUrl: string; expiresAt: string }>(
        `/quotations/${quotationId}/public-link`,
        { method: 'POST' },
      );
    },
    onSuccess: (link) => {
      setPublicLink(link.publicUrl);
      const digits = job?.customer?.phone?.replace(/\D/g, '') ?? '';
      const greeting = job?.customer?.name ? `Olá, ${job.customer.name}!` : 'Olá!';
      const plate = job?.vehicle?.plate ? ` (${job.vehicle.plate})` : '';
      const text = `${greeting} Segue o orçamento da OS ${job?.number}${plate}: ${link.publicUrl}`;
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, '_blank');
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar o link'),
  });

  async function copyLink(): Promise<void> {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      toast.success('Link copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }

  if (isLoading) return <Spinner />;
  if (!job) return <QueryError error={error} onRetry={() => void refetch()} />;

  const existingInvoice = job.invoices?.[0];
  const actions = ACTIONS[job.status] ?? [];
  const canInvoice =
    !existingInvoice &&
    ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'].includes(job.status);

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-2xl font-semibold uppercase tracking-wide text-ink">
              {job.vehicle?.plate ?? job.number}
            </div>
            <div className="mt-1 text-sm text-ink-muted">
              {job.vehicle?.brand?.name} {job.vehicle?.model?.name} {job.vehicle?.year ?? ''}
            </div>
          </div>
          <Badge tone={enumTone(JOB_STATUS, job.status)}>
            {enumLabel(JOB_STATUS, job.status)}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-surface-line bg-surface p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">
              {job.customer?.name ?? 'Sem cliente'}
            </div>
            <div className="text-xs text-ink-soft">OS {job.number}</div>
          </div>
          {job.customer?.phone ? (
            <a
              href={`tel:${job.customer.phone.replace(/\D/g, '')}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-dark"
              aria-label="Ligar para o cliente"
            >
              <Phone size={18} />
            </a>
          ) : null}
        </div>
      </header>

      {job.customerComplaint ? (
        <p className="rounded-xl bg-surface-soft p-3 text-sm text-ink-muted">
          “{job.customerComplaint}”
        </p>
      ) : null}

      {actions.length > 0 ? (
        <div className="space-y-2">
          {actions.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={transition.isPending}
              onClick={() => transition.mutate(action.status)}
              className={
                action.secondary
                  ? 'flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-surface-line bg-surface text-base font-medium text-ink transition active:scale-[0.99] disabled:opacity-50'
                  : 'flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50'
              }
            >
              {action.label}
              {action.secondary ? null : <ArrowRight size={18} />}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Serviços
        </h2>
        {job.lines && job.lines.length > 0 ? (
          job.lines.map((line) => (
            <div
              key={line.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">
                  {line.description ?? enumLabel(LINE_TYPE, line.type)}
                </div>
                <div className="text-xs text-ink-soft">
                  {enumLabel(LINE_TYPE, line.type)} · {Number(line.quantity)}x
                </div>
              </div>
              <div className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {formatMoney(line.total)}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-surface-line p-4 text-sm text-ink-muted">
            Nenhum serviço lançado. Adicione no computador ou volte e crie a OS com serviços.
          </p>
        )}
        <div className="flex items-baseline justify-between rounded-xl bg-surface-soft px-3 py-3">
          <span className="text-sm text-ink-muted">Total</span>
          <span className="text-xl font-semibold tabular-nums text-ink">
            {formatMoney(job.total)}
          </span>
        </div>
      </div>

      {(job.lines?.length ?? 0) > 0 && job.status !== 'CANCELLED' ? (
        <div className="space-y-2">
          <button
            type="button"
            disabled={sendQuotationLink.isPending}
            onClick={() => sendQuotationLink.mutate()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-brand bg-brand-soft text-base font-semibold text-brand-dark transition active:scale-[0.99] disabled:opacity-50"
          >
            <MessageCircle size={18} />
            {sendQuotationLink.isPending ? 'Gerando link…' : 'Enviar orçamento no WhatsApp'}
          </button>
          {publicLink ? (
            <div className="rounded-xl border border-surface-line bg-surface p-3">
              <div className="text-xs text-ink-soft">
                Link do orçamento · válido por 7 dias
              </div>
              <div className="mt-1 truncate font-mono text-xs text-brand">{publicLink}</div>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
              >
                <Copy size={14} /> Copiar link
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {existingInvoice ? (
        <Link
          href={`/m/caixa/${existingInvoice.id}`}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-state-success text-base font-semibold text-white"
        >
          <CircleDollarSign size={18} /> Receber {existingInvoice.number}
        </Link>
      ) : canInvoice ? (
        <button
          type="button"
          disabled={invoice.isPending}
          onClick={() => invoice.mutate()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-state-success text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
        >
          <CircleDollarSign size={18} />
          {invoice.isPending ? 'Faturando…' : `Faturar ${formatMoney(job.total)}`}
        </button>
      ) : null}
    </div>
  );
}
