'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatMoney, formatNumber } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import type { Part } from '@/lib/types';
import { useDebounced } from '@/lib/use-debounced';
import { useAuth } from '@/components/auth-provider';
import { useConfirm } from '@/components/confirm';
import { DataTable, usePagedQuery, type Column } from '@/components/data-table';
import {
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
} from '@/components/ui';

interface PartForm {
  name: string;
  sku: string;
  costPrice: string;
  salePrice: string;
  minStock: string;
}

const EMPTY: PartForm = { name: '', sku: '', costPrice: '', salePrice: '', minStock: '' };

const COLUMNS: Column<Part>[] = [
  { key: 'name', header: 'Nome', cell: (part) => <span className="font-medium">{part.name}</span> },
  { key: 'sku', header: 'SKU', cell: (part) => part.sku ?? '-' },
  { key: 'cost', header: 'Custo', align: 'right', cell: (part) => formatMoney(part.costPrice) },
  { key: 'sale', header: 'Venda', align: 'right', cell: (part) => formatMoney(part.salePrice) },
  {
    key: 'minStock',
    header: 'Estoque mín.',
    align: 'right',
    cell: (part) => formatNumber(part.minStock),
  },
];

export default function PartsPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [form, setForm] = useState<PartForm>(EMPTY);
  const [error, setError] = useState('');

  const { query, page, setPage } = usePagedQuery<Part>('parts', '/parts', {
    search: debouncedSearch,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = JSON.stringify({
        name: form.name,
        sku: form.sku || undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        minStock: form.minStock ? Number(form.minStock) : undefined,
      });
      if (editing) {
        await apiFetch(`/parts/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/parts', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts'] });
      setOpen(false);
      toast.success(editing ? 'Peça atualizada' : 'Peça cadastrada');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/parts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Peça excluída');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
  });

  function openCreate(): void {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setOpen(true);
  }

  function openEdit(part: Part): void {
    setEditing(part);
    setForm({
      name: part.name,
      sku: part.sku ?? '',
      costPrice: String(part.costPrice ?? ''),
      salePrice: String(part.salePrice ?? ''),
      minStock: String(part.minStock ?? ''),
    });
    setError('');
    setOpen(true);
  }

  async function confirmRemove(part: Part): Promise<void> {
    const ok = await confirm({
      title: 'Excluir peça',
      description: `"${part.name}" deixará de aparecer no catálogo. O histórico de estoque é preservado.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(part.id);
  }

  function set<K extends keyof PartForm>(key: K, value: PartForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canCreate = hasPermission(granted, 'part.create');
  const canEdit = hasPermission(granted, 'part.edit');
  const canDelete = hasPermission(granted, 'part.delete');

  return (
    <div>
      <PageHeader
        title="Peças"
        subtitle="Catálogo de peças e insumos"
        actions={canCreate ? <Button onClick={openCreate}>Nova peça</Button> : null}
      />

      <Card className="p-4">
        <SearchInput
          className="mb-3"
          aria-label="Buscar peças"
          placeholder="Buscar por nome ou SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(part) => part.id}
          page={page}
          onPageChange={setPage}
          onRowClick={canEdit ? openEdit : undefined}
          rowActions={(part) => [
            { label: 'Editar', onSelect: () => openEdit(part), hidden: !canEdit },
            {
              label: 'Excluir',
              onSelect: () => void confirmRemove(part),
              danger: true,
              hidden: !canDelete,
            },
          ]}
          emptyMessage={
            debouncedSearch
              ? 'Nenhuma peça encontrada para essa busca.'
              : 'Nenhuma peça cadastrada ainda.'
          }
          emptyAction={
            !debouncedSearch && canCreate ? (
              <Button onClick={openCreate}>Cadastrar a primeira peça</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar peça' : 'Nova peça'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="part-form" disabled={save.isPending || !form.name}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="part-form"
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
            <Field label="SKU">
              <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} />
            </Field>
            <Field label="Custo">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.costPrice}
                onChange={(e) => set('costPrice', e.target.value)}
              />
            </Field>
            <Field label="Venda">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.salePrice}
                onChange={(e) => set('salePrice', e.target.value)}
              />
            </Field>
            <Field label="Estoque mínimo">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                value={form.minStock}
                onChange={(e) => set('minStock', e.target.value)}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
