'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { JobCard, JobStatus, Paginated, TeamMember } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorText,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  Td,
  Th,
} from '@/components/ui';

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

export default function JobCardDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [line, setLine] = useState({
    type: 'LABOR',
    description: '',
    quantity: '1',
    unitPrice: '',
  });
  const [mechanic, setMechanic] = useState({ userId: '', role: '', hours: '' });

  const team = useQuery({
    queryKey: ['users', 'options'],
    queryFn: () => apiFetch<Paginated<TeamMember>>('/users?pageSize=100'),
  });

  const job = useQuery({
    queryKey: ['job-card', id],
    queryFn: () => apiFetch<JobCard>(`/job-cards/${id}`),
    enabled: Boolean(id),
  });

  const invalidate = (): void => {
    qc.invalidateQueries({ queryKey: ['job-card', id] });
    qc.invalidateQueries({ queryKey: ['job-cards'] });
  };

  const transition = useMutation({
    mutationFn: (status: JobStatus) =>
      apiFetch(`/job-cards/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const addLine = useMutation({
    mutationFn: async () => {
      await apiFetch(`/job-cards/${id}/lines`, {
        method: 'POST',
        body: JSON.stringify({
          type: line.type,
          description: line.description || undefined,
          quantity: Number(line.quantity) || 1,
          unitPrice: Number(line.unitPrice) || 0,
        }),
      });
    },
    onSuccess: () => {
      invalidate();
      setLine({ type: 'LABOR', description: '', quantity: '1', unitPrice: '' });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const removeLine = useMutation({
    mutationFn: (lineId: string) =>
      apiFetch(`/job-cards/${id}/lines/${lineId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
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
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const removeMechanic = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/job-cards/${id}/mechanics/${userId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  if (job.isLoading) return <Spinner />;
  if (!job.data) return <EmptyState message="OS não encontrada." />;

  const data = job.data;
  const nextStatuses = TRANSITIONS[data.status] ?? [];

  return (
    <div>
      <PageHeader
        title={`OS ${data.number}`}
        subtitle={`${data.customer?.name ?? ''} · ${data.vehicle?.plate ?? ''}`}
        actions={<Badge tone="blue">{data.status}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Itens</h2>
            <div className="text-sm text-slate-600">
              Total: <strong>{formatMoney(data.total)}</strong>
            </div>
          </div>

          {!data.lines || data.lines.length === 0 ? (
            <EmptyState message="Nenhum item lançado." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Tipo</Th>
                  <Th>Descrição</Th>
                  <Th className="text-right">Qtd</Th>
                  <Th className="text-right">Unitário</Th>
                  <Th className="text-right">Total</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.lines.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <Td>{item.type}</Td>
                    <Td>{item.description ?? '-'}</Td>
                    <Td className="text-right">{String(item.quantity)}</Td>
                    <Td className="text-right">{formatMoney(item.unitPrice)}</Td>
                    <Td className="text-right">{formatMoney(item.total)}</Td>
                    <Td className="text-right">
                      <Button variant="ghost" onClick={() => removeLine.mutate(item.id)}>
                        Remover
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <ErrorText>{error}</ErrorText>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Field label="Tipo">
                <Select
                  value={line.type}
                  onChange={(e) => setLine((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="LABOR">Mão de obra</option>
                  <option value="PART">Peça</option>
                  <option value="SERVICE">Serviço</option>
                  <option value="CUSTOM">Outro</option>
                </Select>
              </Field>
              <div className="md:col-span-2">
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
                  value={line.quantity}
                  onChange={(e) => setLine((p) => ({ ...p, quantity: e.target.value }))}
                />
              </Field>
              <Field label="Unitário">
                <Input
                  type="number"
                  value={line.unitPrice}
                  onChange={(e) => setLine((p) => ({ ...p, unitPrice: e.target.value }))}
                />
              </Field>
            </div>
            <div className="mt-3">
              <Button onClick={() => addLine.mutate()} disabled={addLine.isPending}>
                Adicionar item
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-800">Ações</h2>
          <p className="mt-1 text-xs text-slate-500">Mudar status da OS</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {nextStatuses.length === 0 ? (
              <span className="text-sm text-slate-500">Sem transições disponíveis.</span>
            ) : (
              nextStatuses.map((status) => (
                <Button
                  key={status}
                  variant={status === 'CANCELLED' ? 'danger' : 'secondary'}
                  onClick={() => transition.mutate(status)}
                  disabled={transition.isPending}
                >
                  {status}
                </Button>
              ))
            )}
          </div>

          <h3 className="mt-6 text-sm font-semibold text-slate-800">Mecânicos</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {data.mechanics?.length ? (
              data.mechanics.map((item) => (
                <li key={item.userId} className="flex items-center justify-between gap-2">
                  <span>
                    {item.user?.name ?? item.userId}
                    {item.role ? ` · ${item.role}` : ''}
                  </span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-red-600"
                    onClick={() => removeMechanic.mutate(item.userId)}
                  >
                    remover
                  </button>
                </li>
              ))
            ) : (
              <li>Nenhum mecânico atribuído.</li>
            )}
          </ul>
          <div className="mt-3 space-y-2">
            <Select
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
                placeholder="Função"
                value={mechanic.role}
                onChange={(e) => setMechanic((p) => ({ ...p, role: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Horas"
                value={mechanic.hours}
                onChange={(e) => setMechanic((p) => ({ ...p, hours: e.target.value }))}
              />
            </div>
            <Button
              variant="secondary"
              className="w-full"
              disabled={!mechanic.userId || assignMechanic.isPending}
              onClick={() => assignMechanic.mutate()}
            >
              Atribuir
            </Button>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-slate-800">Histórico</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {data.statusHistory?.map((entry) => (
              <li key={entry.id}>
                {entry.toStatus} · {new Date(entry.changedAt).toLocaleString('pt-BR')}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
