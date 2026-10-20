'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, ServiceItem } from '@/lib/types';
import { formatMoney, formatNumber } from '@/lib/format';
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
  Spinner,
  Td,
  Th,
  Textarea,
} from '@/components/ui';
import { useConfirm } from '@/components/confirm';

interface ServiceForm {
  name: string;
  code: string;
  description: string;
  basePrice: string;
  standardTime: string;
  isActive: boolean;
}

const EMPTY: ServiceForm = {
  name: '',
  code: '',
  description: '',
  basePrice: '',
  standardTime: '',
  isActive: true,
};

export default function ServicesPage(): JSX.Element {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['services', search],
    queryFn: () => apiFetch<Paginated<ServiceItem>>(`/services${buildQuery({ search })}`),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
        basePrice: form.basePrice ? Number(form.basePrice) : undefined,
        standardTime: form.standardTime ? Number(form.standardTime) : undefined,
        isActive: form.isActive,
      };
      const body = JSON.stringify(payload);
      if (editing) {
        await apiFetch(`/services/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/services', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/services/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  function openCreate(): void {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setOpen(true);
  }

  function openEdit(service: ServiceItem): void {
    setEditing(service);
    setForm({
      name: service.name,
      code: service.code ?? '',
      description: service.description ?? '',
      basePrice: String(service.basePrice ?? ''),
      standardTime: service.standardTime != null ? String(service.standardTime) : '',
      isActive: service.isActive,
    });
    setError('');
    setOpen(true);
  }

  function set<K extends keyof ServiceForm>(key: K, value: ServiceForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        title="Serviços"
        subtitle="Catálogo de serviços para OS e orçamentos"
        actions={<Button onClick={openCreate}>Novo serviço</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-sm">
          <Input
            placeholder="Buscar por nome ou código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhum serviço cadastrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Nome</Th>
                  <Th>Código</Th>
                  <Th className="text-right">Preço base</Th>
                  <Th className="text-right">Tempo padrão (h)</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((service) => (
                  <tr key={service.id} className="border-b border-slate-100">
                    <Td>{service.name}</Td>
                    <Td>{service.code ?? '-'}</Td>
                    <Td className="text-right">{formatMoney(service.basePrice)}</Td>
                    <Td className="text-right">
                      {service.standardTime != null ? formatNumber(service.standardTime) : '-'}
                    </Td>
                    <Td>
                      <Badge tone={service.isActive ? 'green' : 'slate'}>
                        {service.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(service)}>
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={async () => {
                            if (await confirm({ title: `Excluir ${service.name}?`, confirmLabel: 'Excluir', tone: 'danger' })) {
                              remove.mutate(service.id);
                            }
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
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
        title={editing ? 'Editar serviço' : 'Novo serviço'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Código">
            <Input value={form.code} onChange={(e) => set('code', e.target.value)} />
          </Field>
          <Field label="Preço base">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.basePrice}
              onChange={(e) => set('basePrice', e.target.value)}
            />
          </Field>
          <Field label="Tempo padrão (horas)">
            <Input
              type="number"
              step="0.25"
              min="0"
              value={form.standardTime}
              onChange={(e) => set('standardTime', e.target.value)}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
            />
            Serviço ativo
          </label>
        </div>
      </Modal>
    </div>
  );
}
