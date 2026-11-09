'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Wrench } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { JOB_STATUS, enumLabel, enumTone } from '@/lib/labels';
import type { JobCard, JobStatus, Paginated } from '@/lib/types';
import { Badge, QueryError, Spinner } from '@/components/ui';

const SECTIONS: { title: string; statuses: JobStatus[] }[] = [
  { title: 'Aguardando aprovação', statuses: ['WAITING_APPROVAL'] },
  {
    title: 'Na oficina',
    statuses: ['CHECKED_IN', 'IN_INSPECTION', 'APPROVED', 'IN_PROGRESS', 'WAITING_PARTS'],
  },
  { title: 'Prontas para entrega', statuses: ['COMPLETED'] },
];

function today(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export default function HojePage(): JSX.Element {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['m', 'job-cards'],
    queryFn: () => apiFetch<Paginated<JobCard>>('/job-cards?pageSize=50'),
  });

  const jobs = data?.items ?? [];
  const visible = jobs.filter((job) =>
    SECTIONS.some((section) => section.statuses.includes(job.status)),
  );
  const total = visible.reduce((sum, job) => sum + Number(job.total ?? 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs font-medium uppercase tracking-wider text-ink-soft">
          {today()}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Hoje</h1>
        {visible.length > 0 ? (
          <p className="mt-1 text-sm text-ink-muted">
            {visible.length} {visible.length === 1 ? 'veículo' : 'veículos'} ·{' '}
            <span className="tabular-nums">{formatMoney(total)}</span> em serviço
          </p>
        ) : null}
      </header>

      {isLoading ? <Spinner /> : null}
      {isError ? <QueryError error={error} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-8 text-center">
          <Wrench size={28} className="mx-auto text-ink-soft" />
          <p className="mt-3 text-sm font-medium text-ink">Nenhum carro na oficina agora</p>
          <p className="mt-1 text-sm text-ink-muted">
            Toque em <span className="font-semibold text-brand">Nova OS</span> para começar.
          </p>
        </div>
      ) : null}

      {SECTIONS.map((section) => {
        const items = jobs.filter((job) => section.statuses.includes(job.status));
        if (items.length === 0) return null;
        return (
          <section key={section.title} className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              {section.title} · {items.length}
            </h2>
            {items.map((job) => (
              <Link
                key={job.id}
                href={`/m/os/${job.id}`}
                className="block rounded-2xl border border-surface-line bg-surface p-4 shadow-card transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-lg font-semibold uppercase tracking-wide text-ink">
                      {job.vehicle?.plate ?? job.number}
                    </div>
                    <div className="truncate text-sm text-ink-muted">
                      {job.customer?.name ?? 'Sem cliente'}
                    </div>
                  </div>
                  <Badge tone={enumTone(JOB_STATUS, job.status)}>
                    {enumLabel(JOB_STATUS, job.status)}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-surface-line pt-3">
                  <span className="text-xs text-ink-soft">OS {job.number}</span>
                  <span className="flex items-center gap-1 text-sm font-semibold tabular-nums text-ink">
                    {formatMoney(job.total)}
                    <ChevronRight size={16} className="text-ink-soft" />
                  </span>
                </div>
              </Link>
            ))}
          </section>
        );
      })}
    </div>
  );
}
