'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ArrowLeft,
  Car,
  Check,
  ChevronDown,
  ClipboardList,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Trash2,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/lib/format';
import {
  INVOICE_STATUS,
  JOB_STATUS,
  JOB_TYPE,
  LINE_TYPE,
  enumLabel,
  enumOptions,
} from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import { useServices } from '@/lib/queries';
import type { JobCard, JobStatus, Paginated, TeamMember } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useConfirm } from '@/components/confirm';
import {
  Button,
  Card,
  EmptyState,
  ErrorText,
  Field,
  Input,
  QueryError,
  Select,
  Spinner,
  StatusBadge,
  cn,
} from '@/components/ui';

/** Espelha as transições válidas do servidor (job-cards.service). */
const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  DRAFT: ['SCHEDULED', 'CHECKED_IN', 'CANCELLED'],
  SCHEDULED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['IN_INSPECTION', 'IN_PROGRESS', 'WAITING_APPROVAL', 'CANCELLED'],
  IN_INSPECTION: ['WAITING_APPROVAL', 'IN_PROGRESS', 'CANCELLED'],
  WAITING_APPROVAL: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'COMPLETED', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['DELIVERED', 'LOCKED'],
  DELIVERED: ['LOCKED'],
  LOCKED: [],
  CANCELLED: [],
};

/** Verbo do botão que leva a OS para cada status. */
const ACTION_LABEL: Record<JobStatus, string> = {
  DRAFT: 'Voltar a rascunho',
  SCHEDULED: 'Agendar',
  CHECKED_IN: 'Receber veículo',
  IN_INSPECTION: 'Iniciar inspeção',
  WAITING_APPROVAL: 'Enviar para aprovação',
  APPROVED: 'Registrar aprovação',
  IN_PROGRESS: 'Iniciar execução',
  WAITING_PARTS: 'Aguardar peças',
  COMPLETED: 'Concluir serviço',
  DELIVERED: 'Entregar ao cliente',
  LOCKED: 'Fechar OS',
  CANCELLED: 'Cancelar OS',
};

function actionLabel(from: JobStatus, to: JobStatus): string {
  if (from === 'WAITING_PARTS' && to === 'IN_PROGRESS') return 'Retomar execução';
  return ACTION_LABEL[to];
}

/** Próximo passo natural do fluxo — vira o botão principal; o resto vai para "Mais ações". */
const PRIMARY: Partial<Record<JobStatus, JobStatus>> = {
  DRAFT: 'CHECKED_IN',
  SCHEDULED: 'CHECKED_IN',
  CHECKED_IN: 'IN_PROGRESS',
  IN_INSPECTION: 'WAITING_APPROVAL',
  WAITING_APPROVAL: 'APPROVED',
  APPROVED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  WAITING_PARTS: 'IN_PROGRESS',
  COMPLETED: 'DELIVERED',
  DELIVERED: 'LOCKED',
};

const STEPS: { label: string; reachedBy: JobStatus[] }[] = [
  { label: 'Recebida', reachedBy: ['CHECKED_IN', 'IN_INSPECTION', 'WAITING_APPROVAL', 'APPROVED'] },
  { label: 'Em execução', reachedBy: ['IN_PROGRESS', 'WAITING_PARTS'] },
  { label: 'Concluída', reachedBy: ['COMPLETED'] },
  { label: 'Entregue', reachedBy: ['DELIVERED', 'LOCKED'] },
];

const EDITABLE: JobStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'CHECKED_IN',
  'IN_INSPECTION',
  'WAITING_APPROVAL',
  'APPROVED',
  'IN_PROGRESS',
  'WAITING_PARTS',
];

const EMPTY_LINE = { type: 'LABOR', serviceId: '', description: '', quantity: '1', unitPrice: '' };

function currentStep(status: JobStatus): number {
  return STEPS.findIndex((step) => step.reachedBy.includes(status));
}

function Stepper({ status }: { status: JobStatus }): JSX.Element {
  const active = currentStep(status);
  return (
    <ol className="flex items-center gap-2" aria-label="Andamento da OS">
      {STEPS.map((step, index) => {
        const done = index < active || (index === active && index === STEPS.length - 1);
        const current = index === active && !done;
        return (
          <li
            key={step.label}
            className={cn('flex min-w-0 items-center gap-2', current ? 'flex-auto' : 'flex-1')}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                done && 'bg-state-success text-white',
                current && 'bg-brand text-white ring-4 ring-brand/15',
                !done && !current && 'bg-surface-page text-ink-soft',
              )}
            >
              {done ? <Check size={14} /> : index + 1}
            </span>
            <span
              className={cn(
                'truncate text-xs font-medium',
                current ? 'text-ink' : done ? 'text-ink-muted' : 'text-ink-soft',
                // No celular só a etapa atual leva o nome; as demais ficam no número.
                !current && 'hidden sm:inline',
              )}
              aria-current={current ? 'step' : undefined}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  'hidden h-px flex-1 sm:block',
                  index < active ? 'bg-state-success' : 'bg-surface-line',
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
        {icon}
        {title}
      </div>
      <div className="space-y-0.5 text-sm text-ink">{children}</div>
    </Card>
  );
}

export default function JobCardDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const canEdit = hasPermission(granted, 'job_card.edit');
  const canInvoice = hasPermission(granted, 'invoice.create');

  const [lineOpen, setLineOpen] = useState(false);
  const [lineError, setLineError] = useState('');
  const [line, setLine] = useState(EMPTY_LINE);
  const [mechanic, setMechanic] = useState({ userId: '', role: '', hours: '' });

  const job = useQuery({
    queryKey: ['job-card', id],
    queryFn: () => apiFetch<JobCard>(`/job-cards/${id}`),
    enabled: Boolean(id),
  });
  const team = useQuery({
    queryKey: ['users', 'options'],
    queryFn: () => apiFetch<Paginated<TeamMember>>('/users?pageSize=100'),
    enabled: canEdit,
  });
  const services = useServices();

  const invalidate = (): void => {
    qc.invalidateQueries({ queryKey: ['job-card', id] });
    qc.invalidateQueries({ queryKey: ['job-cards'] });
  };
  const toastError = (err: unknown): void => {
    toast.error(err instanceof Error ? err.message : 'Erro inesperado');
  };

  const transition = useMutation({
    mutationFn: (status: JobStatus) =>
      apiFetch(`/job-cards/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, status) => {
      invalidate();
      toast.success(`OS: ${enumLabel(JOB_STATUS, status)}`);
    },
    onError: toastError,
  });

  const addLine = useMutation({
    mutationFn: () =>
      apiFetch(`/job-cards/${id}/lines`, {
        method: 'POST',
        body: JSON.stringify({
          type: line.type,
          serviceId: line.serviceId || undefined,
          description: line.description || undefined,
          quantity: Number(line.quantity) || 1,
          unitPrice: Number(line.unitPrice) || 0,
        }),
      }),
    onSuccess: () => {
      invalidate();
      setLine(EMPTY_LINE);
      setLineError('');
      toast.success('Item adicionado');
    },
    onError: (err) => setLineError(err instanceof Error ? err.message : 'Erro ao adicionar'),
  });

  const removeLine = useMutation({
    mutationFn: (lineId: string) =>
      apiFetch(`/job-cards/${id}/lines/${lineId}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Item removido');
    },
    onError: toastError,
  });

  const assignMechanic = useMutation({
    mutationFn: () =>
      apiFetch(`/job-cards/${id}/mechanics`, {
        method: 'POST',
        body: JSON.stringify({
          userId: mechanic.userId,
          role: mechanic.role || undefined,
          hours: mechanic.hours ? Number(mechanic.hours) : undefined,
        }),
      }),
    onSuccess: () => {
      invalidate();
      setMechanic({ userId: '', role: '', hours: '' });
      toast.success('Mecânico atribuído');
    },
    onError: toastError,
  });

  const removeMechanic = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/job-cards/${id}/mechanics/${userId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: toastError,
  });

  const invoice = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string; number: string }>(`/invoices/from-job/${id}`, { method: 'POST' }),
    onSuccess: (created) => {
      invalidate();
      toast.success(`Fatura ${created.number} gerada`);
      router.push(`/invoices/${created.id}`);
    },
    onError: toastError,
  });

  function applyService(value: string): void {
    const service = services.data?.items.find((item) => item.id === value);
    setLine((p) => ({
      ...p,
      serviceId: value,
      type: service ? 'SERVICE' : p.type,
      description: service?.name ?? p.description,
      unitPrice: service ? String(service.basePrice) : p.unitPrice,
    }));
  }

  async function runTransition(status: JobStatus): Promise<void> {
    if (status === 'CANCELLED' || status === 'LOCKED') {
      const ok = await confirm({
        title: status === 'CANCELLED' ? 'Cancelar esta OS?' : 'Fechar esta OS?',
        description:
          status === 'CANCELLED'
            ? 'A OS deixa de aceitar alterações e não poderá ser reaberta.'
            : 'Depois de fechada, a OS não aceita mais alterações.',
        confirmLabel: ACTION_LABEL[status],
        tone: status === 'CANCELLED' ? 'danger' : 'primary',
      });
      if (!ok) return;
    }
    transition.mutate(status);
  }

  async function confirmRemoveLine(lineId: string, description: string): Promise<void> {
    const ok = await confirm({
      title: 'Remover item',
      description: `Remover "${description}" desta OS?`,
      confirmLabel: 'Remover',
      tone: 'danger',
    });
    if (ok) removeLine.mutate(lineId);
  }

  if (job.isLoading) return <Spinner />;
  if (job.isError) return <QueryError error={job.error} onRetry={() => void job.refetch()} />;
  if (!job.data) return <EmptyState message="OS não encontrada." />;

  const data = job.data;
  const next = TRANSITIONS[data.status] ?? [];
  const forward: JobStatus[] = next.filter((status) => status !== 'CANCELLED');
  const preferred = PRIMARY[data.status];
  const primary = preferred && forward.includes(preferred) ? preferred : forward[0];
  const secondary = forward.filter((status) => status !== primary);
  const canCancel = next.includes('CANCELLED');
  const editable = canEdit && EDITABLE.includes(data.status);
  const invoices = (data.invoices ?? []).filter((item) => item.status !== 'CANCELLED');
  const invoiceable =
    canInvoice &&
    (data.status === 'COMPLETED' || data.status === 'DELIVERED') &&
    invoices.length === 0;
  const vehicleName = [data.vehicle?.brand?.name, data.vehicle?.model?.name, data.vehicle?.year]
    .filter(Boolean)
    .join(' ');
  const history = [...(data.statusHistory ?? [])].reverse();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/job-cards"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft size={15} />
          Ordens de serviço
        </Link>
      </div>

      {/* Cabeçalho */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                OS {data.number}
              </h1>
              <StatusBadge map={JOB_STATUS} value={data.status} />
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {enumLabel(JOB_TYPE, data.type)} · aberta em {formatDateTime(data.createdAt)}
              {data.branch ? ` · ${data.branch.name}` : ''}
            </p>
          </div>

          {invoices.length > 0 || (canEdit && (primary || canCancel || invoiceable)) ? (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {invoices.map((item) => (
                <Link
                  key={item.id}
                  href={`/invoices/${item.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-surface-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition hover:bg-surface-soft"
                >
                  <Receipt size={16} className="text-ink-muted" />
                  Fatura {item.number}
                  <StatusBadge map={INVOICE_STATUS} value={item.status} />
                </Link>
              ))}
              {canEdit && invoiceable ? (
                <Button onClick={() => invoice.mutate()} disabled={invoice.isPending}>
                  <Receipt size={16} />
                  {invoice.isPending ? 'Gerando…' : 'Gerar fatura'}
                </Button>
              ) : null}
              {canEdit && primary ? (
                <Button
                  variant={invoiceable ? 'secondary' : 'primary'}
                  onClick={() => void runTransition(primary)}
                  disabled={transition.isPending}
                >
                  {actionLabel(data.status, primary)}
                </Button>
              ) : null}
              {canEdit && (secondary.length > 0 || canCancel) ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="secondary" disabled={transition.isPending}>
                      Mais ações
                      <ChevronDown size={15} />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={6}
                      className="z-50 min-w-[200px] rounded-xl border border-surface-line bg-surface p-1.5 shadow-pop data-[state=open]:animate-fade-in"
                    >
                      {secondary.map((status) => (
                        <DropdownMenu.Item
                          key={status}
                          onSelect={() => void runTransition(status)}
                          className="cursor-pointer rounded-lg px-2.5 py-2 text-sm text-ink outline-none data-[highlighted]:bg-surface-page"
                        >
                          {actionLabel(data.status, status)}
                        </DropdownMenu.Item>
                      ))}
                      {canCancel ? (
                        <>
                          {secondary.length > 0 ? (
                            <DropdownMenu.Separator className="my-1 h-px bg-surface-line" />
                          ) : null}
                          <DropdownMenu.Item
                            onSelect={() => void runTransition('CANCELLED')}
                            className="cursor-pointer rounded-lg px-2.5 py-2 text-sm text-state-danger outline-none data-[highlighted]:bg-state-danger/10"
                          >
                            {ACTION_LABEL.CANCELLED}
                          </DropdownMenu.Item>
                        </>
                      ) : null}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-5 border-t border-surface-line pt-4">
          {data.status === 'CANCELLED' ? (
            <div className="flex items-center gap-2 text-sm text-state-danger">
              <X size={16} />
              Esta OS foi cancelada.
            </div>
          ) : (
            <Stepper status={data.status} />
          )}
        </div>
      </Card>

      {/* Contexto */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard icon={<User size={14} />} title="Cliente">
          <div className="font-medium">{data.customer?.name ?? '-'}</div>
          {data.customer?.phone ? (
            <a
              href={`tel:${data.customer.phone}`}
              className="flex items-center gap-1.5 text-ink-muted hover:text-brand"
            >
              <Phone size={13} />
              {data.customer.phone}
            </a>
          ) : null}
          {data.customer?.email ? (
            <div className="truncate text-ink-muted">{data.customer.email}</div>
          ) : null}
        </InfoCard>
        <InfoCard icon={<Car size={14} />} title="Veículo">
          <div className="font-mono font-medium uppercase">{data.vehicle?.plate ?? '-'}</div>
          {vehicleName ? <div className="text-ink-muted">{vehicleName}</div> : null}
          {data.odometerIn ? (
            <div className="text-ink-muted">Entrada: {formatNumber(data.odometerIn, 0)} km</div>
          ) : null}
        </InfoCard>
        <InfoCard icon={<MapPin size={14} />} title="Atendimento">
          <div>{data.branch?.name ?? '-'}</div>
          {data.advisor ? <div className="text-ink-muted">Consultor: {data.advisor.name}</div> : null}
          {data.completedAt ? (
            <div className="text-ink-muted">Concluída em {formatDate(data.completedAt)}</div>
          ) : data.startedAt ? (
            <div className="text-ink-muted">Iniciada em {formatDate(data.startedAt)}</div>
          ) : null}
        </InfoCard>
      </div>

      {data.customerComplaint ? (
        <Card className="border-l-4 border-l-brand p-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
            <ClipboardList size={14} />
            Reclamação do cliente
          </div>
          <p className="whitespace-pre-line text-sm text-ink">{data.customerComplaint}</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Itens */}
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-ink">Itens</h2>
            {editable && !lineOpen ? (
              <Button variant="secondary" onClick={() => setLineOpen(true)}>
                <Plus size={16} />
                Adicionar item
              </Button>
            ) : null}
          </div>

          {editable && lineOpen ? (
            <form
              className="mb-4 space-y-3 rounded-xl border border-surface-line bg-surface-soft p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!addLine.isPending) addLine.mutate();
              }}
            >
              <ErrorText>{lineError}</ErrorText>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Serviço do catálogo (opcional)">
                  <Select value={line.serviceId} onChange={(e) => applyService(e.target.value)}>
                    <option value="">Nenhum (item livre)</option>
                    {services.data?.items.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Tipo">
                  <Select
                    value={line.type}
                    onChange={(e) => setLine((p) => ({ ...p, type: e.target.value }))}
                  >
                    {enumOptions(LINE_TYPE).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="col-span-2">
                  <Field label="Descrição">
                    <Input
                      value={line.description}
                      onChange={(e) => setLine((p) => ({ ...p, description: e.target.value }))}
                    />
                  </Field>
                </div>
                <Field label="Qtd">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={line.quantity}
                    onChange={(e) => setLine((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </Field>
                <Field label="Unitário (R$)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={line.unitPrice}
                    onChange={(e) => setLine((p) => ({ ...p, unitPrice: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setLineOpen(false);
                    setLineError('');
                  }}
                >
                  Fechar
                </Button>
                <Button
                  type="submit"
                  disabled={addLine.isPending || (!line.description && !line.serviceId)}
                >
                  {addLine.isPending ? 'Adicionando…' : 'Adicionar'}
                </Button>
              </div>
            </form>
          ) : null}

          {!data.lines || data.lines.length === 0 ? (
            <EmptyState
              message="Nenhum item lançado nesta OS."
              action={
                editable && !lineOpen ? (
                  <Button onClick={() => setLineOpen(true)}>Adicionar o primeiro item</Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                    <th className="border-b border-surface-line px-3 py-2.5">Descrição</th>
                    <th className="border-b border-surface-line px-3 py-2.5 text-right">Qtd</th>
                    <th className="border-b border-surface-line px-3 py-2.5 text-right">Unitário</th>
                    <th className="border-b border-surface-line px-3 py-2.5 text-right">Total</th>
                    {editable ? <th className="w-10 border-b border-surface-line" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((item) => (
                    <tr key={item.id} className="border-b border-surface-line/70 text-sm">
                      <td className="px-3 py-3">
                        <div className="text-ink">{item.description ?? '-'}</div>
                        <div className="text-xs text-ink-muted">{enumLabel(LINE_TYPE, item.type)}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatNumber(item.quantity, 3)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatMoney(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">
                        {formatMoney(item.total)}
                      </td>
                      {editable ? (
                        <td className="px-2 py-3 text-right">
                          <button
                            type="button"
                            aria-label={`Remover ${item.description ?? 'item'}`}
                            className="rounded-md p-1.5 text-ink-soft transition hover:bg-state-danger/10 hover:text-state-danger"
                            onClick={() =>
                              void confirmRemoveLine(item.id, item.description ?? 'item')
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-muted">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(data.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-muted">
              <dt>Impostos</dt>
              <dd className="tabular-nums">{formatMoney(data.taxTotal)}</dd>
            </div>
            <div className="flex justify-between border-t border-surface-line pt-1.5 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(data.total)}</dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-4">
          {/* Mecânicos */}
          <Card className="p-4">
            <h2 className="text-base font-semibold text-ink">Mecânicos</h2>
            <ul className="mt-3 space-y-2">
              {data.mechanics?.length ? (
                data.mechanics.map((item) => (
                  <li key={item.userId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-light text-[11px] font-semibold text-brand-dark">
                        {(item.user?.name ?? '?').slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-ink">{item.user?.name ?? item.userId}</span>
                        {item.role || item.hours ? (
                          <span className="block text-xs text-ink-muted">
                            {[item.role, item.hours ? `${formatNumber(item.hours)} h` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    {editable ? (
                      <button
                        type="button"
                        aria-label={`Remover ${item.user?.name ?? 'mecânico'}`}
                        className="rounded-md p-1.5 text-ink-soft transition hover:bg-state-danger/10 hover:text-state-danger"
                        onClick={() => removeMechanic.mutate(item.userId)}
                      >
                        <X size={15} />
                      </button>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-ink-muted">Nenhum mecânico atribuído.</li>
              )}
            </ul>

            {editable ? (
              <form
                className="mt-4 space-y-2 border-t border-surface-line pt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (mechanic.userId && !assignMechanic.isPending) assignMechanic.mutate();
                }}
              >
                <Select
                  aria-label="Membro da equipe"
                  value={mechanic.userId}
                  onChange={(e) => setMechanic((p) => ({ ...p, userId: e.target.value }))}
                >
                  <option value="">Selecione o membro…</option>
                  {team.data?.items.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    aria-label="Função"
                    placeholder="Função"
                    value={mechanic.role}
                    onChange={(e) => setMechanic((p) => ({ ...p, role: e.target.value }))}
                  />
                  <Input
                    aria-label="Horas"
                    type="number"
                    min="0"
                    step="0.25"
                    placeholder="Horas"
                    value={mechanic.hours}
                    onChange={(e) => setMechanic((p) => ({ ...p, hours: e.target.value }))}
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={!mechanic.userId || assignMechanic.isPending}
                >
                  Atribuir
                </Button>
              </form>
            ) : null}
          </Card>

          {/* Histórico */}
          <Card className="p-4">
            <h2 className="text-base font-semibold text-ink">Histórico</h2>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Sem mudanças de status.</p>
            ) : (
              <ol className="mt-3 space-y-0">
                {history.map((entry, index) => (
                  <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < history.length - 1 ? (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-surface-line" />
                    ) : null}
                    <span
                      className={cn(
                        'relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2',
                        index === 0 ? 'border-brand bg-brand' : 'border-surface-line bg-surface',
                      )}
                    />
                    <div>
                      <div className="text-sm text-ink">{enumLabel(JOB_STATUS, entry.toStatus)}</div>
                      <div className="text-xs text-ink-muted">{formatDateTime(entry.changedAt)}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
