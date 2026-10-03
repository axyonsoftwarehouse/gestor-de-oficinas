'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
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
}

interface StockReport {
  itemsCount: number;
  costValue: string | number;
  saleValue: string | number;
  lowStockCount: number;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }): JSX.Element {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
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

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral da oficina" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Faturado" value={formatMoney(financial.data?.invoiced.total)} hint={`${financial.data?.invoiced.count ?? 0} fatura(s)`} />
        <Kpi label="Recebido" value={formatMoney(financial.data?.received.total)} hint={`${financial.data?.received.count ?? 0} pagamento(s)`} />
        <Kpi label="Despesas" value={formatMoney(financial.data?.expenses.total)} hint={`${financial.data?.expenses.count ?? 0} lançamento(s)`} />
        <Kpi label="Líquido" value={formatMoney(financial.data?.net)} hint="Recebido − despesas" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-800">Ordens de serviço</div>
          <div className="mt-2 text-2xl font-semibold">{jobCards.data?.total ?? 0}</div>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {jobCards.data?.byStatus.map((row) => (
              <li key={row.status} className="flex justify-between">
                <span>{row.status}</span>
                <span>{row._count._all}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-800">Estoque</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex justify-between"><span>Itens</span><span>{stock.data?.itemsCount ?? 0}</span></li>
            <li className="flex justify-between"><span>Valor de custo</span><span>{formatMoney(stock.data?.costValue)}</span></li>
            <li className="flex justify-between"><span>Valor de venda</span><span>{formatMoney(stock.data?.saleValue)}</span></li>
            <li className="flex justify-between"><span>Baixo estoque</span><span>{stock.data?.lowStockCount ?? 0}</span></li>
          </ul>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-800">Atalhos</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="text-slate-700 underline" href="/job-cards">Abrir ordens de serviço</a></li>
            <li><a className="text-slate-700 underline" href="/invoices">Ver faturas</a></li>
            <li><a className="text-slate-700 underline" href="/quotations">Ver orçamentos</a></li>
            <li><a className="text-slate-700 underline" href="/stock">Consultar estoque</a></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
