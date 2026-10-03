'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Inspection, InspectionTemplate, Paginated } from '@/lib/types';
import { useBranches, useVehicles } from '@/lib/queries';
import { formatDateTime } from '@/lib/format';
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

function tone(status: string): 'slate' | 'green' | 'amber' | 'blue' {
  if (status === 'COMPLETED') return 'green';
  if (status === 'IN_PROGRESS') return 'blue';
  if (status === 'CANCELLED') return 'amber';
  return 'slate';
}

export default function InspectionsPage(): JSX.Element {
  const router = useRouter();
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

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', status],
    queryFn: () =>
      apiFetch<Paginated<Inspection>>(`/inspections${buildQuery({ status, pageSize: 50 })}`),
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
    onSuccess: (inspection) => router.push(`/inspections/${inspection.id}`),
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  function openCreate(): void {
    setError('');
    setForm({
      branchId: branches.data?.[0]?.id ?? '',
      vehicleId: vehicles.data?.items[0]?.id ?? '',
      templateId: templates.data?.items[0]?.id ?? '',
      notes: '',
    });
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Inspeções"
        subtitle="Execução de checklists de entrada"
        actions={
          <div className="flex gap-2">
            <Link href="/inspection-templates">
              <Button variant="secondary">Checklists</Button>
            </Link>
            <Button onClick={openCreate}>Nova inspeção</Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="mb-3 max-w-xs">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluída</option>
            <option value="CANCELLED">Cancelada</option>
          </Select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhuma inspeção encontrada." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Veículo</Th>
                <Th>OS</Th>
                <Th>Status</Th>
                <Th>Iniciada</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((inspection) => (
                <tr key={inspection.id} className="border-b border-slate-100">
                  <Td>{inspection.vehicle?.plate ?? '-'}</Td>
                  <Td>{inspection.jobCard?.number ?? '-'}</Td>
                  <Td>
                    <Badge tone={tone(inspection.status)}>{inspection.status}</Badge>
                  </Td>
                  <Td>{formatDateTime(inspection.startedAt ?? inspection.createdAt)}</Td>
                  <Td className="text-right">
                    <Link href={`/inspections/${inspection.id}`} className="text-sm underline">
                      Abrir
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
            <Button
              onClick={() => start.mutate()}
              disabled={
                start.isPending || !form.branchId || !form.vehicleId || !form.templateId
              }
            >
              {start.isPending ? 'Iniciando…' : 'Iniciar inspeção'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <Field label="Checklist">
          <Select
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
        <div className="grid grid-cols-2 gap-4">
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
          <Field label="Veículo">
            <Select
              value={form.vehicleId}
              onChange={(e) => setForm((p) => ({ ...p, vehicleId: e.target.value }))}
            >
              <option value="">Selecione…</option>
              {vehicles.data?.items.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate ?? vehicle.id.slice(0, 8)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Observações">
          <Input
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </Field>
      </Modal>
    </div>
  );
}
