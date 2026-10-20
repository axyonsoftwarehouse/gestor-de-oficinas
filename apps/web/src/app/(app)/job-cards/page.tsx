'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type { JobCard } from '@/lib/types';
import { useBranches, useCustomers, useVehicles } from '@/lib/queries';
import { formatMoney } from '@/lib/format';
import { JOB_STATUS, JOB_TYPE, enumLabel, enumOptions } from '@/lib/labels';
import { DataTable, usePagedQuery, type Column } from '@/components/data-table';
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

const COLUMNS: Column<JobCard>[] = [
  { key: 'number', header: 'Número', cell: (job) => <span className="font-medium">{job.number}</span> },
  { key: 'type', header: 'Tipo', cell: (job) => enumLabel(JOB_TYPE, job.type) },
  { key: 'customer', header: 'Cliente', cell: (job) => job.customer?.name ?? '-' },
  {
    key: 'vehicle',
    header: 'Veículo',
    cell: (job) => <span className="font-mono text-xs uppercase">{job.vehicle?.plate ?? '-'}</span>,
  },
  { key: 'status', header: 'Status', cell: (job) => <StatusBadge map={JOB_STATUS} value={job.status} /> },
  { key: 'total', header: 'Total', align: 'right', cell: (job) => formatMoney(job.total) },
];

export default function JobCardsPage(): JSX.Element {
  const qc = useQueryClient();
  const router = useRouter();
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

  const { query, page, setPage } = usePagedQuery<JobCard>('job-cards', '/job-cards', { status });

  const create = useMutation({
    mutationFn: () =>
      apiFetch<JobCard>('/job-cards', {
        method: 'POST',
        body: JSON.stringify({
          branchId: form.branchId,
          type: form.type,
          customerId: form.customerId,
          vehicleId: form.vehicleId,
          customerComplaint: form.customerComplaint || undefined,
        }),
      }),
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ['job-cards'] });
      setOpen(false);
      toast.success(`OS ${job.number} criada`);
      router.push(`/job-cards/${job.id}`);
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

  // `/job-cards?new=1` (ex.: botão "Nova OS" do Dashboard) já abre o formulário.
  const openedFromLink = useRef(false);
  useEffect(() => {
    if (openedFromLink.current || branches.isLoading) return;
    if (new URLSearchParams(window.location.search).has('new')) {
      openedFromLink.current = true;
      openCreate();
      router.replace('/job-cards');
    }
  }, [branches.isLoading]);

  const canSave = Boolean(form.branchId && form.customerId && form.vehicleId) && !create.isPending;

  return (
    <div>
      <PageHeader
        title="Ordens de serviço"
        subtitle="Acompanhe a execução dos serviços"
        actions={<Button onClick={openCreate}>Nova OS</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-xs">
          <Select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {enumOptions(JOB_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(job) => job.id}
          page={page}
          onPageChange={setPage}
          onRowClick={(job) => router.push(`/job-cards/${job.id}`)}
          emptyMessage={
            status ? 'Nenhuma OS com esse status.' : 'Nenhuma ordem de serviço ainda.'
          }
          emptyAction={status ? undefined : <Button onClick={openCreate}>Abrir a primeira OS</Button>}
        />
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
            <Button type="submit" form="job-card-form" disabled={!canSave}>
              {create.isPending ? 'Salvando…' : 'Criar OS'}
            </Button>
          </>
        }
      >
        <form
          id="job-card-form"
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
                value={form.branchId}
                onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}
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
              <Select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
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
                onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value, vehicleId: '' }))}
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
                onChange={(e) => setForm((p) => ({ ...p, vehicleId: e.target.value }))}
              >
                <option value="">{form.customerId ? 'Selecione…' : 'Escolha o cliente primeiro'}</option>
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
        </form>
      </Modal>
    </div>
  );
}
