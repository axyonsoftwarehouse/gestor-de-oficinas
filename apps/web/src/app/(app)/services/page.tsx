'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatMoney, formatNumber } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import type { ServiceItem } from '@/lib/types';
import { useDebounced } from '@/lib/use-debounced';
import { useAuth } from '@/components/auth-provider';
import { useConfirm } from '@/components/confirm';
import { DataTable, usePagedQuery, type Column } from '@/components/data-table';
import {
  Badge,
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Textarea,
} from '@/components/ui';

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

const COLUMNS: Column<ServiceItem>[] = [
  {
    key: 'name',
    header: 'Nome',
    cell: (service) => (
      <div>
        <div className="font-medium">{service.name}</div>
        {service.code ? <div className="text-xs text-ink-muted">{service.code}</div> : null}
      </div>
    ),
  },
  {
    key: 'basePrice',
    header: 'Preço base',
    align: 'right',
    cell: (service) => formatMoney(service.basePrice),
  },
  {
    key: 'standardTime',
    header: 'Tempo padrão (h)',
    align: 'right',
    cell: (service) =>
      service.standardTime != null ? formatNumber(service.standardTime) : '-',
  },
  {
    key: 'status',
    header: 'Status',
    cell: (service) => (
      <Badge tone={service.isActive ? 'green' : 'slate'}>
        {service.isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    ),
  },
];

export default function ServicesPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY);
  const [error, setError] = useState('');

  const { query, page, setPage } = usePagedQuery<ServiceItem>('services', '/services', {
    search: debouncedSearch,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = JSON.stringify({
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
        basePrice: form.basePrice ? Number(form.basePrice) : undefined,
        standardTime: form.standardTime ? Number(form.standardTime) : undefined,
        isActive: form.isActive,
      });
      if (editing) {
        await apiFetch(`/services/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/services', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
      toast.success(editing ? 'Serviço atualizado' : 'Serviço cadastrado');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/services/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço excluído');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
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

  async function confirmRemove(service: ServiceItem): Promise<void> {
    const ok = await confirm({
      title: 'Excluir serviço',
      description: `"${service.name}" deixará de aparecer no catálogo. OS e orçamentos já emitidos não mudam.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(service.id);
  }

  function set<K extends keyof ServiceForm>(key: K, value: ServiceForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canCreate = hasPermission(granted, 'service.create');
  const canEdit = hasPermission(granted, 'service.edit');
  const canDelete = hasPermission(granted, 'service.delete');

  return (
    <div>
      <PageHeader
        title="Serviços"
        subtitle="Catálogo de serviços para OS e orçamentos"
        actions={canCreate ? <Button onClick={openCreate}>Novo serviço</Button> : null}
      />

      <Card className="p-4">
        <SearchInput
          className="mb-3"
          aria-label="Buscar serviços"
          placeholder="Buscar por nome ou código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(service) => service.id}
          page={page}
          onPageChange={setPage}
          onRowClick={canEdit ? openEdit : undefined}
          rowActions={(service) => [
            { label: 'Editar', onSelect: () => openEdit(service), hidden: !canEdit },
            {
              label: 'Excluir',
              onSelect: () => void confirmRemove(service),
              danger: true,
              hidden: !canDelete,
            },
          ]}
          emptyMessage={
            debouncedSearch
              ? 'Nenhum serviço encontrado para essa busca.'
              : 'Nenhum serviço cadastrado ainda.'
          }
          emptyAction={
            !debouncedSearch && canCreate ? (
              <Button onClick={openCreate}>Cadastrar o primeiro serviço</Button>
            ) : undefined
          }
        />
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
            <Button type="submit" form="service-form" disabled={save.isPending || !form.name}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="service-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.name && !save.isPending) save.mutate();
          }}
        >
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                autoFocus
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </Field>
            <Field label="Código">
              <Input value={form.code} onChange={(e) => set('code', e.target.value)} />
            </Field>
            <Field label="Preço base">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.basePrice}
                onChange={(e) => set('basePrice', e.target.value)}
              />
            </Field>
            <Field label="Tempo padrão (horas)">
              <Input
                type="number"
                inputMode="decimal"
                step="0.25"
                min="0"
                value={form.standardTime}
                onChange={(e) => set('standardTime', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Descrição">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
            />
            Serviço ativo
          </label>
        </form>
      </Modal>
    </div>
  );
}
