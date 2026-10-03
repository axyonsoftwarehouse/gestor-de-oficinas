'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { BarList, CHART_COLORS, DonutChart, type ChartDatum } from '@/components/charts';
import { Card, PageHeader, Spinner } from '@/components/ui';

interface FinancialReport {
  invoiced: { total: string | number; count: number };
  received: { total: string | number; count: number };
  expenses: { total: string | number; count: number };
  net: string | number;
}

interface JobCardsReport {
  total: number;
  byStatus: { status: string; _count: { _all: number } }[];
  byType: { type: string; _count: { _all: number } }[];
}

interface StockReport {
  itemsCount: number;
  costValue: string | number;
  saleValue: string | number;
  lowStockCount: number;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  CHECKED_IN: 'Recebida',
  IN_INSPECTION: 'Em inspeção',
  WAITING_APPROVAL: 'Aguard. aprovação',
  APPROVED: 'Aprovada',
  IN_PROGRESS: 'Em execução',
  WAITING_PARTS: 'Aguard. peças',
  COMPLETED: 'Concluída',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelada',
  LOCKED: 'Fechada',
};

const TYPE_LABELS: Record<string, string> = {
  INSPECTION: 'Inspeção',
  REPAIR: 'Reparo',
  SERVICE: 'Serviço',
};

const PALETTE = [
  CHART_COLORS.brand,
  CHART_COLORS.accent,
  CHART_COLORS.orange,
  CHART_COLORS.teal,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
];

function Kpi({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  color: string;
}): JSX.Element {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        <span className="h-1.5 w-16 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-soft">{hint}</div> : null}
    </Card>
  );
}

export default function DashboardPage(): JSX.Element {
  const financial = useQuery({
    queryKey: ['reports', 'financial'],
    queryFn: () => apiFetch<FinancialReport>('/reports/financial'),
  });
  const jobCards = useQuery({
    queryKey: ['reports', 'job-cards'],
    queryFn: () => apiFetch<JobCardsReport>('/reports/job-cards'),
  });
  const stock = useQuery({
    queryKey: ['reports', 'stock'],
    queryFn: () => apiFetch<StockReport>('/reports/stock'),
  });

  if (financial.isLoading || jobCards.isLoading || stock.isLoading) {
    return <Spinner />;
  }

  const statusData: ChartDatum[] = (jobCards.data?.byStatus ?? []).map((row, index) => ({
    label: STATUS_LABELS[row.status] ?? row.status,
    value: row._count._all,
    color: PALETTE[index % PALETTE.length]!,
  }));

  const typeData: ChartDatum[] = (jobCards.data?.byType ?? []).map((row, index) => ({
    label: TYPE_LABELS[row.type] ?? row.type,
    value: row._count._all,
    color: PALETTE[index % PALETTE.length]!,
  }));

  const financeData: ChartDatum[] = [
    { label: 'Faturado', value: Number(financial.data?.invoiced.total ?? 0), color: CHART_COLORS.brand },
    { label: 'Recebido', value: Number(financial.data?.received.total ?? 0), color: CHART_COLORS.accent },
    { label: 'Despesas', value: Number(financial.data?.expenses.total ?? 0), color: CHART_COLORS.orange },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da oficina"
        actions={
          <Link href="/invoices">
            <span className="rounded-lg border border-surface-line bg-white px-3.5 py-2 text-sm font-medium text-ink hover:bg-surface-soft">
              Ver faturas
            </span>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Faturado"
          value={formatMoney(financial.data?.invoiced.total)}
          hint={`${financial.data?.invoiced.count ?? 0} fatura(s)`}
          color={CHART_COLORS.brand}
        />
        <Kpi
          label="Recebido"
          value={formatMoney(financial.data?.received.total)}
          hint={`${financial.data?.received.count ?? 0} pagamento(s)`}
          color={CHART_COLORS.accent}
        />
        <Kpi
          label="Despesas"
          value={formatMoney(financial.data?.expenses.total)}
          hint={`${financial.data?.expenses.count ?? 0} lançamento(s)`}
          color={CHART_COLORS.orange}
        />
        <Kpi
          label="Líquido"
          value={formatMoney(financial.data?.net)}
          hint="Recebido − despesas"
          color={CHART_COLORS.teal}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Ordens de serviço por status</h2>
            <Link href="/job-cards" className="text-sm font-medium text-brand hover:underline">
              Ver todas
            </Link>
          </div>
          <BarList items={statusData} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-ink">Por tipo</h2>
          <DonutChart items={typeData} centerLabel="OS" />
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-ink">Resumo financeiro</h2>
          <BarList items={financeData} />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Estoque</h2>
            <Link href="/stock" className="text-sm font-medium text-brand hover:underline">
              Abrir
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-ink-muted">Itens</span>
              <span className="font-medium text-ink">{stock.data?.itemsCount ?? 0}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-muted">Valor de custo</span>
              <span className="font-medium text-ink">{formatMoney(stock.data?.costValue)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-muted">Valor de venda</span>
              <span className="font-medium text-ink">{formatMoney(stock.data?.saleValue)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-muted">Baixo estoque</span>
              <span className="font-medium text-state-danger">{stock.data?.lowStockCount ?? 0}</span>
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-ink">Atalhos</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="text-brand hover:underline" href="/job-cards">Ordens de serviço</Link></li>
            <li><Link className="text-brand hover:underline" href="/quotations">Orçamentos</Link></li>
            <li><Link className="text-brand hover:underline" href="/inspections">Inspeções</Link></li>
            <li><Link className="text-brand hover:underline" href="/purchases">Compras</Link></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
