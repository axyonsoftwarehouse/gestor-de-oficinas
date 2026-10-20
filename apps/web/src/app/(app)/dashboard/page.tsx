'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CalendarClock, Plus, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import { formatMoney, formatNumber } from '@/lib/format';
import { APPOINTMENT_STATUS, JOB_STATUS, JOB_TYPE, enumLabel } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import type { Appointment, JobCard, Paginated } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { BarList, CHART_COLORS, type ChartDatum } from '@/components/charts';
import { Button, Card, QueryError, Spinner, StatusBadge, cn } from '@/components/ui';

interface FinancialReport {
  invoiced: { total: string | number; count: number };
  received: { total: string | number; count: number };
  expenses: { total: string | number; count: number };
  net: string | number;
  receivable: { total: string | number; count: number };
}

interface JobCardsReport {
  total: number;
  byStatus: { status: string; _count: { _all: number } }[];
}

interface StockReport {
  itemsCount: number;
  costValue: string | number;
  saleValue: string | number;
  lowStockCount: number;
  lowStock: {
    partId: string;
    quantity: string | number;
    part: { id: string; name: string; sku?: string | null; minStock: string | number };
    location?: { id: string; name: string } | null;
  }[];
}

type Period = 'today' | '7d' | 'month' | '30d';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '30d', label: '30 dias' },
];

/** Status em que a OS ainda está "no pátio" — o funil operacional. */
const OPEN_STATUSES = [
  'CHECKED_IN',
  'IN_INSPECTION',
  'WAITING_APPROVAL',
  'APPROVED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'COMPLETED',
];

const STATUS_COLOR: Record<string, string> = {
  CHECKED_IN: CHART_COLORS.teal,
  IN_INSPECTION: CHART_COLORS.teal,
  WAITING_APPROVAL: CHART_COLORS.orange,
  APPROVED: CHART_COLORS.brand,
  IN_PROGRESS: CHART_COLORS.brand,
  WAITING_PARTS: CHART_COLORS.orange,
  COMPLETED: CHART_COLORS.accent,
};

function periodRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === '7d') start.setDate(start.getDate() - 6);
  if (period === '30d') start.setDate(start.getDate() - 29);
  if (period === 'month') start.setDate(1);
  return { from: start.toISOString(), to: now.toISOString() };
}

function todayRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1);
  return { from: start.toISOString(), to: end.toISOString() };
}

function Kpi({
  label,
  value,
  hint,
  tone = 'default',
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative' | 'attention';
  href?: string;
}): JSX.Element {
  const body = (
    <Card className={cn('h-full p-5', href && 'transition hover:border-brand/40')}>
      <div className="text-sm text-ink-muted">{label}</div>
      <div
        className={cn(
          'mt-2 text-2xl font-semibold tracking-tight tabular-nums',
          tone === 'positive' && 'text-state-success',
          tone === 'negative' && 'text-state-danger',
          tone === 'attention' && 'text-ink',
          tone === 'default' && 'text-ink',
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-ink-muted">{hint}</div> : null}
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand/30">
      {body}
    </Link>
  ) : (
    body
  );
}

function Panel({
  title,
  icon,
  href,
  hrefLabel = 'Ver tudo',
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <Card className={cn('flex flex-col p-5', className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          {icon ? <span className="text-ink-muted">{icon}</span> : null}
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-brand hover:underline"
          >
            {hrefLabel}
            <ArrowRight size={14} />
          </Link>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

function PanelEmpty({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="flex h-full min-h-[96px] items-center justify-center rounded-lg bg-surface-soft p-4 text-center text-sm text-ink-muted">
      {children}
    </div>
  );
}

export default function DashboardPage(): JSX.Element {
  const router = useRouter();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const canReports = hasPermission(granted, 'report.view');
  const canJobs = hasPermission(granted, 'job_card.view');
  const canAgenda = hasPermission(granted, 'appointment.view');
  const canCreateJob = hasPermission(granted, 'job_card.create');

  const [period, setPeriod] = useState<Period>('month');
  const range = useMemo(() => periodRange(period), [period]);
  const today = useMemo(() => todayRange(), []);

  const financial = useQuery({
    queryKey: ['reports', 'financial', period],
    queryFn: () => apiFetch<FinancialReport>(`/reports/financial${buildQuery(range)}`),
    enabled: canReports,
  });
  const jobsReport = useQuery({
    queryKey: ['reports', 'job-cards'],
    queryFn: () => apiFetch<JobCardsReport>('/reports/job-cards'),
    enabled: canReports,
  });
  const stock = useQuery({
    queryKey: ['reports', 'stock'],
    queryFn: () => apiFetch<StockReport>('/reports/stock'),
    enabled: canReports,
  });
  const agenda = useQuery({
    queryKey: ['appointments', 'today', today.from],
    queryFn: () =>
      apiFetch<Paginated<Appointment>>(`/appointments${buildQuery({ ...today, pageSize: 8 })}`),
    enabled: canAgenda,
  });
  const recentJobs = useQuery({
    queryKey: ['job-cards', 'recent'],
    queryFn: () => apiFetch<Paginated<JobCard>>('/job-cards?pageSize=6'),
    enabled: canJobs,
  });

  const firstName = session?.user.name.split(' ')[0] ?? '';
  const todayRaw = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const todayLabel = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);

  const pipeline: ChartDatum[] = OPEN_STATUSES.map((status) => ({
    label: enumLabel(JOB_STATUS, status),
    value: jobsReport.data?.byStatus.find((row) => row.status === status)?._count._all ?? 0,
    color: STATUS_COLOR[status] ?? CHART_COLORS.brand,
  })).filter((item) => item.value > 0);
  const openTotal = pipeline.reduce((sum, item) => sum + item.value, 0);
  const net = Number(financial.data?.net ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {firstName ? `Olá, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{todayLabel}</p>
        </div>
        {canCreateJob ? (
          <Button onClick={() => router.push('/job-cards?new=1')}>
            <Plus size={16} />
            Nova OS
          </Button>
        ) : null}
      </div>

      {canReports ? (
        <section aria-labelledby="finance-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="finance-title" className="text-sm font-semibold text-ink-muted">
              Financeiro
            </h2>
            <div
              role="radiogroup"
              aria-label="Período"
              className="inline-flex rounded-lg border border-surface-line bg-surface p-0.5"
            >
              {PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={period === option.value}
                  onClick={() => setPeriod(option.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition',
                    period === option.value
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {financial.isError ? (
            <QueryError error={financial.error} onRetry={() => void financial.refetch()} />
          ) : financial.isLoading ? (
            <Spinner />
          ) : (
            <div
              className={cn(
                'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
                financial.isFetching && 'opacity-60',
              )}
            >
              <Kpi
                label="Faturado"
                value={formatMoney(financial.data?.invoiced.total)}
                hint={`${financial.data?.invoiced.count ?? 0} fatura(s) emitida(s)`}
                href="/invoices"
              />
              <Kpi
                label="Recebido"
                value={formatMoney(financial.data?.received.total)}
                hint={`${financial.data?.received.count ?? 0} pagamento(s)`}
              />
              <Kpi
                label="A receber"
                value={formatMoney(financial.data?.receivable.total)}
                hint={`${financial.data?.receivable.count ?? 0} fatura(s) em aberto · hoje`}
                tone="attention"
                href="/invoices"
              />
              <Kpi
                label="Resultado"
                value={formatMoney(net)}
                hint={`Recebido − ${formatMoney(financial.data?.expenses.total)} em despesas`}
                tone={net > 0 ? 'positive' : net < 0 ? 'negative' : 'default'}
              />
            </div>
          )}
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {canAgenda ? (
          <Panel title="Agenda de hoje" icon={<CalendarClock size={17} />} href="/appointments">
            {agenda.isLoading ? (
              <Spinner />
            ) : agenda.isError ? (
              <QueryError error={agenda.error} onRetry={() => void agenda.refetch()} />
            ) : !agenda.data?.items.length ? (
              <PanelEmpty>Nenhum agendamento para hoje.</PanelEmpty>
            ) : (
              <ul className="divide-y divide-surface-line/70">
                {agenda.data.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-ink">
                      {new Date(item.scheduledStart).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {item.customer?.name ?? '-'}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        <span className="font-mono uppercase">{item.vehicle?.plate ?? '-'}</span>
                        {' · '}
                        {enumLabel(JOB_TYPE, item.type)}
                      </span>
                    </span>
                    <StatusBadge map={APPOINTMENT_STATUS} value={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : null}

        {canJobs ? (
          <Panel
            title="OS recentes"
            icon={<Wrench size={17} />}
            href="/job-cards"
            className={canAgenda ? undefined : 'xl:col-span-2'}
          >
            {recentJobs.isLoading ? (
              <Spinner />
            ) : recentJobs.isError ? (
              <QueryError error={recentJobs.error} onRetry={() => void recentJobs.refetch()} />
            ) : !recentJobs.data?.items.length ? (
              <PanelEmpty>Nenhuma OS aberta ainda.</PanelEmpty>
            ) : (
              <ul className="divide-y divide-surface-line/70">
                {recentJobs.data.items.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/job-cards/${job.id}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-surface-soft"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {job.number}
                          <span className="font-normal text-ink-muted"> · {job.customer?.name ?? '-'}</span>
                        </span>
                        <span className="block font-mono text-xs uppercase text-ink-muted">
                          {job.vehicle?.plate ?? '-'}
                        </span>
                      </span>
                      <StatusBadge map={JOB_STATUS} value={job.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : null}

        {canReports ? (
          <Panel
            title="No pátio"
            href="/job-cards"
            className={canAgenda && canJobs ? 'md:col-span-2 xl:col-span-1' : undefined}
          >
            {jobsReport.isLoading ? (
              <Spinner />
            ) : jobsReport.isError ? (
              <QueryError error={jobsReport.error} onRetry={() => void jobsReport.refetch()} />
            ) : openTotal === 0 ? (
              <PanelEmpty>Nenhuma OS em andamento.</PanelEmpty>
            ) : (
              <>
                <div className="mb-4 text-3xl font-semibold tabular-nums text-ink">
                  {openTotal}
                  <span className="ml-2 text-sm font-normal text-ink-muted">OS em andamento</span>
                </div>
                <BarList items={pipeline} />
              </>
            )}
          </Panel>
        ) : null}
      </div>

      {canReports ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            title="Estoque baixo"
            icon={<AlertTriangle size={17} />}
            href="/stock"
            hrefLabel="Abrir estoque"
            className="lg:col-span-2"
          >
            {stock.isLoading ? (
              <Spinner />
            ) : stock.isError ? (
              <QueryError error={stock.error} onRetry={() => void stock.refetch()} />
            ) : !stock.data?.lowStock.length ? (
              <PanelEmpty>Nenhuma peça abaixo do estoque mínimo.</PanelEmpty>
            ) : (
              <ul className="divide-y divide-surface-line/70">
                {stock.data.lowStock.slice(0, 6).map((item) => (
                  <li
                    key={`${item.partId}-${item.location?.id ?? ''}`}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{item.part.name}</span>
                      <span className="block truncate text-xs text-ink-muted">
                        {[item.part.sku, item.location?.name].filter(Boolean).join(' · ') || '-'}
                      </span>
                    </span>
                    <span className="text-right text-sm tabular-nums">
                      <span className="font-semibold text-state-danger">
                        {formatNumber(item.quantity, 3)}
                      </span>
                      <span className="text-ink-muted"> / mín. {formatNumber(item.part.minStock, 3)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Valor em estoque">
            {stock.data ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Itens com saldo</dt>
                  <dd className="font-medium tabular-nums text-ink">{stock.data.itemsCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Custo</dt>
                  <dd className="font-medium tabular-nums text-ink">{formatMoney(stock.data.costValue)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Venda</dt>
                  <dd className="font-medium tabular-nums text-ink">{formatMoney(stock.data.saleValue)}</dd>
                </div>
                <div className="flex justify-between border-t border-surface-line pt-3">
                  <dt className="text-ink-muted">Abaixo do mínimo</dt>
                  <dd
                    className={cn(
                      'font-semibold tabular-nums',
                      stock.data.lowStockCount > 0 ? 'text-state-danger' : 'text-ink',
                    )}
                  >
                    {stock.data.lowStockCount}
                  </dd>
                </div>
              </dl>
            ) : stock.isLoading ? (
              <Spinner />
            ) : null}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
