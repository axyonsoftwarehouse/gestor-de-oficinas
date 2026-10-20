'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch, buildQuery } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { INSPECTION_STATUS, enumOptions } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import { useBranches, useVehicles } from '@/lib/queries';
import type { Inspection, InspectionTemplate, Paginated } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
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

const COLUMNS: Column<Inspection>[] = [
  {
    key: 'vehicle',
    header: 'Veículo',
    cell: (inspection) => (
      <div>
        <div className="font-mono text-xs font-medium uppercase">
          {inspection.vehicle?.plate ?? '-'}
        </div>
        <div className="text-xs text-ink-muted">
          {[inspection.vehicle?.brand?.name, inspection.vehicle?.model?.name]
            .filter(Boolean)
            .join(' ')}
        </div>
      </div>
    ),
  },
  { key: 'job', header: 'OS', cell: (inspection) => inspection.jobCard?.number ?? '-' },
  {
    key: 'status',
    header: 'Status',
    cell: (inspection) => <StatusBadge map={INSPECTION_STATUS} value={inspection.status} />,
  },
  {
    key: 'started',
    header: 'Iniciada',
    cell: (inspection) => (
      <span className="whitespace-nowrap">
        {formatDateTime(inspection.startedAt ?? inspection.createdAt)}
      </span>
    ),
  },
];

export default function InspectionsPage(): JSX.Element {
  const router = useRouter();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    branchId: '',
    vehicleId: '',
    templateId: '',
    notes: '',
  });

  const branches = useBranches();
  const vehicles = useVehicles();
  const templates = useQuery({
    queryKey: ['inspection-templates', 'options'],
    queryFn: () =>
      apiFetch<Paginated<InspectionTemplate>>(
        `/inspection-templates${buildQuery({ pageSize: 100 })}`,
      ),
  });

  const { query, page, setPage } = usePagedQuery<Inspection>('inspections', '/inspections', {
    status,
  });

  const start = useMutation({
    mutationFn: () =>
      apiFetch<Inspection>('/inspections', {
        method: 'POST',
        body: JSON.stringify({
          branchId: form.branchId,
          vehicleId: form.vehicleId,
          templateId: form.templateId,
          notes: form.notes || undefined,
        }),
      }),
    onSuccess: (inspection) => {
      toast.success('Inspeção iniciada');
      router.push(`/inspections/${inspection.id}`);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao iniciar'),
  });

  function openCreate(): void {
    setError('');
    setForm({
      branchId: branches.data?.[0]?.id ?? '',
      vehicleId: '',
      templateId: templates.data?.items[0]?.id ?? '',
      notes: '',
    });
    setOpen(true);
  }

  const canCreate = hasPermission(granted, 'inspection.create');
  const canSave =
    Boolean(form.branchId && form.vehicleId && form.templateId) && !start.isPending;

  return (
    <div>
      <PageHeader
        title="Inspeções"
        subtitle="Execução de checklists de entrada"
        actions={
          <>
            <Link href="/inspection-templates">
              <Button variant="secondary">Checklists</Button>
            </Link>
            {canCreate ? <Button onClick={openCreate}>Nova inspeção</Button> : null}
          </>
        }
      />

      <Card className="p-4">
        <div className="mb-3 w-full sm:max-w-xs">
          <Select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {enumOptions(INSPECTION_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(inspection) => inspection.id}
          page={page}
          onPageChange={setPage}
          onRowClick={(inspection) => router.push(`/inspections/${inspection.id}`)}
          emptyMessage={status ? 'Nenhuma inspeção com esse status.' : 'Nenhuma inspeção ainda.'}
          emptyAction={
            !status && canCreate ? (
              <Button onClick={openCreate}>Iniciar a primeira inspeção</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova inspeção"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="inspection-form" disabled={!canSave}>
              {start.isPending ? 'Iniciando…' : 'Iniciar inspeção'}
            </Button>
          </>
        }
      >
        <form
          id="inspection-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) start.mutate();
          }}
        >
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Checklist">
              <Select
                required
                value={form.templateId}
                onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value }))}
              >
                <option value="">Selecione…</option>
                {templates.data?.items.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Filial">
              <Select
                required
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
            <Field label="Veículo">
              <Select
                required
                value={form.vehicleId}
                onChange={(e) => setForm((p) => ({ ...p, vehicleId: e.target.value }))}
              >
                <option value="">Selecione…</option>
                {vehicles.data?.items.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate ?? vehicle.id.slice(0, 8)}
                    {vehicle.customer ? ` — ${vehicle.customer.name}` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Observações">
              <Input
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
