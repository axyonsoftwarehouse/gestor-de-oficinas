'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Appointment, Paginated } from '@/lib/types';
import { useBranches, useCustomers, useVehicles } from '@/lib/queries';
import { formatDateTime } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Td,
  Th,
  StatusBadge,
} from '@/components/ui';
import { APPOINTMENT_STATUS, JOB_TYPE, enumLabel } from '@/lib/labels';

interface AppointmentForm {
  branchId: string;
  customerId: string;
  vehicleId: string;
  type: string;
  scheduledStart: string;
  notes: string;
}

export default function AppointmentsPage(): JSX.Element {
  const qc = useQueryClient();
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

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', status],
    queryFn: () =>
      apiFetch<Paginated<Appointment>>(
        `/appointments${buildQuery({ status, pageSize: 50 })}`,
      ),
  });

  const create = useMutation({
    mutationFn: async () => {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          branchId: form.branchId,
          customerId: form.customerId || undefined,
          vehicleId: form.vehicleId || undefined,
          type: form.type,
          scheduledStart: new Date(form.scheduledStart).toISOString(),
          notes: form.notes || undefined,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) =>
      apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });

  function openCreate(): void {
    setError('');
    setForm({
      branchId: branches.data?.[0]?.id ?? '',
      customerId: customers.data?.items[0]?.id ?? '',
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

  return (
    <div>
      <PageHeader
        title="Agendamentos"
        subtitle="Agenda de serviços"
        actions={<Button onClick={openCreate}>Novo agendamento</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-xs">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="SCHEDULED">Agendado</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="CHECKED_IN">Recebido</option>
            <option value="COMPLETED">Concluído</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="NO_SHOW">Não compareceu</option>
          </Select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhum agendamento encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Quando</Th>
                  <Th>Cliente</Th>
                  <Th>Veículo</Th>
                  <Th>Tipo</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-slate-100">
                    <Td>{formatDateTime(appointment.scheduledStart)}</Td>
                    <Td>{appointment.customer?.name ?? '-'}</Td>
                    <Td>{appointment.vehicle?.plate ?? '-'}</Td>
                    <Td>{enumLabel(JOB_TYPE, appointment.type)}</Td>
                    <Td><StatusBadge map={APPOINTMENT_STATUS} value={appointment.status} /></Td>
                    <Td className="text-right">
                      {appointment.status !== 'CANCELLED' &&
                      appointment.status !== 'COMPLETED' ? (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            updateStatus.mutate({ id: appointment.id, next: 'CANCELLED' })
                          }
                        >
                          Cancelar
                        </Button>
                      ) : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.branchId || !form.scheduledStart}
            >
              {create.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Filial">
            <Select value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
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
              <option value="INSPECTION">Inspeção</option>
              <option value="REPAIR">Reparo</option>
              <option value="SERVICE">Serviço</option>
            </Select>
          </Field>
          <Field label="Cliente">
            <Select
              value={form.customerId}
              onChange={(e) => {
                set('customerId', e.target.value);
                set('vehicleId', '');
              }}
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
            <Select value={form.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
              <option value="">Selecione…</option>
              {vehicles.data?.items.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate ?? vehicle.id.slice(0, 8)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Início">
            <Input
              type="datetime-local"
              value={form.scheduledStart}
              onChange={(e) => set('scheduledStart', e.target.value)}
            />
          </Field>
          <Field label="Observações">
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
