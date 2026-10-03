'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { JobCard, Paginated } from '@/lib/types';
import { useBranches, useCustomers, useVehicles } from '@/lib/queries';
import { formatMoney } from '@/lib/format';
import {
  Badge,
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
} from '@/components/ui';

function statusTone(status: string): 'slate' | 'green' | 'amber' | 'red' | 'blue' {
  if (status === 'COMPLETED' || status === 'DELIVERED') return 'green';
  if (status === 'CANCELLED') return 'red';
  if (status === 'IN_PROGRESS' || status === 'APPROVED') return 'blue';
  if (status === 'WAITING_APPROVAL' || status === 'WAITING_PARTS') return 'amber';
  return 'slate';
}

export default function JobCardsPage(): JSX.Element {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    branchId: '',
    type: 'REPAIR',
    customerId: '',
    vehicleId: '',
    customerComplaint: '',
  });

  const branches = useBranches();
  const customers = useCustomers();
  const vehicles = useVehicles(form.customerId || undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['job-cards', status],
    queryFn: () =>
      apiFetch<Paginated<JobCard>>(`/job-cards${buildQuery({ status, pageSize: 50 })}`),
  });

  const create = useMutation({
    mutationFn: async () => {
      await apiFetch('/job-cards', {
        method: 'POST',
        body: JSON.stringify({
          branchId: form.branchId,
          type: form.type,
          customerId: form.customerId,
          vehicleId: form.vehicleId,
          customerComplaint: form.customerComplaint || undefined,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-cards'] });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  function openCreate(): void {
    setError('');
    setForm({
      branchId: branches.data?.[0]?.id ?? '',
      type: 'REPAIR',
      customerId: '',
      vehicleId: '',
      customerComplaint: '',
    });
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Ordens de serviço"
        subtitle="Acompanhe a execução dos serviços"
        actions={<Button onClick={openCreate}>Nova OS</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-xs">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="SCHEDULED">Agendada</option>
            <option value="CHECKED_IN">Recebida</option>
            <option value="IN_PROGRESS">Em execução</option>
            <option value="WAITING_PARTS">Aguardando peças</option>
            <option value="COMPLETED">Concluída</option>
            <option value="DELIVERED">Entregue</option>
            <option value="CANCELLED">Cancelada</option>
          </Select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhuma ordem de serviço encontrada." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Número</Th>
                  <Th>Tipo</Th>
                  <Th>Cliente</Th>
                  <Th>Veículo</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((job) => (
                  <tr key={job.id} className="border-b border-slate-100">
                    <Td>{job.number}</Td>
                    <Td>{job.type}</Td>
                    <Td>{job.customer?.name ?? '-'}</Td>
                    <Td>{job.vehicle?.plate ?? '-'}</Td>
                    <Td><Badge tone={statusTone(job.status)}>{job.status}</Badge></Td>
                    <Td className="text-right">{formatMoney(job.total)}</Td>
                    <Td className="text-right">
                      <Link
                        href={`/job-cards/${job.id}`}
                        className="text-sm text-slate-700 underline"
                      >
                        Abrir
                      </Link>
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
        title="Nova ordem de serviço"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.branchId || !form.customerId || !form.vehicleId}
            >
              {create.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Filial">
            <Select value={form.branchId} onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}>
              <option value="">Selecione…</option>
              {branches.data?.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              <option value="INSPECTION">Inspeção</option>
              <option value="REPAIR">Reparo</option>
              <option value="SERVICE">Serviço</option>
            </Select>
          </Field>
          <Field label="Cliente">
            <Select
              value={form.customerId}
              onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value, vehicleId: '' }))}
            >
              <option value="">Selecione…</option>
              {customers.data?.items.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Veículo">
            <Select value={form.vehicleId} onChange={(e) => setForm((p) => ({ ...p, vehicleId: e.target.value }))}>
              <option value="">Selecione…</option>
              {vehicles.data?.items.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate ?? vehicle.id.slice(0, 8)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Reclamação do cliente">
          <Input
            value={form.customerComplaint}
            onChange={(e) => setForm((p) => ({ ...p, customerComplaint: e.target.value }))}
          />
        </Field>
      </Modal>
    </div>
  );
}
