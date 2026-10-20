'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { APPOINTMENT_STATUS, JOB_TYPE, enumLabel, enumOptions } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import { useBranches, useCustomers, useVehicles } from '@/lib/queries';
import type { Appointment } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useConfirm } from '@/components/confirm';
import { DataTable, usePagedQuery, type Column, type RowAction } from '@/components/data-table';
import {
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from '@/components/ui';

interface AppointmentForm {
  branchId: string;
  customerId: string;
  vehicleId: string;
  type: string;
  scheduledStart: string;
  notes: string;
}

const OPEN_STATUSES = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'];

const COLUMNS: Column<Appointment>[] = [
  {
    key: 'when',
    header: 'Quando',
    cell: (appointment) => (
      <span className="whitespace-nowrap">{formatDateTime(appointment.scheduledStart)}</span>
    ),
  },
  { key: 'customer', header: 'Cliente', cell: (appointment) => appointment.customer?.name ?? '-' },
  {
    key: 'vehicle',
    header: 'Veículo',
    cell: (appointment) => (
      <span className="font-mono text-xs uppercase">{appointment.vehicle?.plate ?? '-'}</span>
    ),
  },
  { key: 'type', header: 'Tipo', cell: (appointment) => enumLabel(JOB_TYPE, appointment.type) },
  {
    key: 'status',
    header: 'Status',
    cell: (appointment) => <StatusBadge map={APPOINTMENT_STATUS} value={appointment.status} />,
  },
];

export default function AppointmentsPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<AppointmentForm>({
    branchId: '',
    customerId: '',
    vehicleId: '',
    type: 'REPAIR',
    scheduledStart: '',
    notes: '',
  });

  const branches = useBranches();
  const customers = useCustomers();
  const vehicles = useVehicles(form.customerId || undefined);

  const { query, page, setPage } = usePagedQuery<Appointment>('appointments', '/appointments', {
    status,
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          branchId: form.branchId,
          customerId: form.customerId || undefined,
          vehicleId: form.vehicleId || undefined,
          type: form.type,
          scheduledStart: new Date(form.scheduledStart).toISOString(),
          notes: form.notes || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setOpen(false);
      toast.success('Agendamento criado');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) =>
      apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      }),
    onSuccess: (_data, { next }) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(`Agendamento marcado como "${enumLabel(APPOINTMENT_STATUS, next)}"`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/appointments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento excluído');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
  });

  function openCreate(): void {
    setError('');
    setForm({
      branchId: branches.data?.[0]?.id ?? '',
      customerId: '',
      vehicleId: '',
      type: 'REPAIR',
      scheduledStart: '',
      notes: '',
    });
    setOpen(true);
  }

  function set<K extends keyof AppointmentForm>(key: K, value: AppointmentForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function confirmCancel(appointment: Appointment): Promise<void> {
    const ok = await confirm({
      title: 'Cancelar agendamento',
      description: `O agendamento de ${formatDateTime(appointment.scheduledStart)} será cancelado.`,
      confirmLabel: 'Cancelar agendamento',
      tone: 'danger',
    });
    if (ok) updateStatus.mutate({ id: appointment.id, next: 'CANCELLED' });
  }

  async function confirmRemove(appointment: Appointment): Promise<void> {
    const ok = await confirm({
      title: 'Excluir agendamento',
      description: `O agendamento de ${formatDateTime(appointment.scheduledStart)} deixará de aparecer na agenda.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(appointment.id);
  }

  const canCreate = hasPermission(granted, 'appointment.create');
  const canEdit = hasPermission(granted, 'appointment.edit');
  const canDelete = hasPermission(granted, 'appointment.delete');
  const canSave = Boolean(form.branchId && form.scheduledStart) && !create.isPending;

  function actionsFor(appointment: Appointment): RowAction[] {
    const isOpen = OPEN_STATUSES.includes(appointment.status);
    const move = (next: string) => () => updateStatus.mutate({ id: appointment.id, next });
    return [
      {
        label: 'Confirmar',
        onSelect: move('CONFIRMED'),
        hidden: !canEdit || appointment.status !== 'SCHEDULED',
      },
      {
        label: 'Marcar como recebido',
        onSelect: move('CHECKED_IN'),
        hidden: !canEdit || !['SCHEDULED', 'CONFIRMED'].includes(appointment.status),
      },
      {
        label: 'Concluir',
        onSelect: move('COMPLETED'),
        hidden: !canEdit || appointment.status !== 'CHECKED_IN',
      },
      {
        label: 'Não compareceu',
        onSelect: move('NO_SHOW'),
        hidden: !canEdit || !['SCHEDULED', 'CONFIRMED'].includes(appointment.status),
      },
      {
        label: 'Cancelar',
        onSelect: () => void confirmCancel(appointment),
        danger: true,
        hidden: !canEdit || !isOpen,
      },
      {
        label: 'Excluir',
        onSelect: () => void confirmRemove(appointment),
        danger: true,
        hidden: !canDelete,
      },
    ];
  }

  return (
    <div>
      <PageHeader
        title="Agendamentos"
        subtitle="Agenda de serviços"
        actions={canCreate ? <Button onClick={openCreate}>Novo agendamento</Button> : null}
      />

      <Card className="p-4">
        <div className="mb-3 w-full sm:max-w-xs">
          <Select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {enumOptions(APPOINTMENT_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(appointment) => appointment.id}
          page={page}
          onPageChange={setPage}
          rowActions={actionsFor}
          emptyMessage={
            status ? 'Nenhum agendamento com esse status.' : 'Nenhum agendamento ainda.'
          }
          emptyAction={
            !status && canCreate ? (
              <Button onClick={openCreate}>Criar o primeiro agendamento</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo agendamento"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="appointment-form" disabled={!canSave}>
              {create.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="appointment-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) create.mutate();
          }}
        >
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Filial">
              <Select
                required
                value={form.branchId}
                onChange={(e) => set('branchId', e.target.value)}
              >
                <option value="">Selecione…</option>
                {branches.data?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                {enumOptions(JOB_TYPE).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cliente">
              <Select
                value={form.customerId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customerId: e.target.value, vehicleId: '' }))
                }
              >
                <option value="">Selecione…</option>
                {customers.data?.items.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Veículo">
              <Select
                value={form.vehicleId}
                disabled={!form.customerId}
                onChange={(e) => set('vehicleId', e.target.value)}
              >
                <option value="">
                  {form.customerId ? 'Selecione…' : 'Escolha o cliente primeiro'}
                </option>
                {vehicles.data?.items.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate ?? vehicle.id.slice(0, 8)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Início">
              <Input
                required
                type="datetime-local"
                value={form.scheduledStart}
                onChange={(e) => set('scheduledStart', e.target.value)}
              />
            </Field>
            <Field label="Observações">
              <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
