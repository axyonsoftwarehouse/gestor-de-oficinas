'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import type { Supplier } from '@/lib/types';
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
  Textarea,
} from '@/components/ui';

interface SupplierForm {
  name: string;
  document: string;
  email: string;
  phone: string;
  notes: string;
}

const EMPTY: SupplierForm = {
  name: '',
  document: '',
  email: '',
  phone: '',
  notes: '',
};

const COLUMNS: Column<Supplier>[] = [
  {
    key: 'name',
    header: 'Nome',
    cell: (supplier) => <span className="font-medium">{supplier.name}</span>,
  },
  { key: 'document', header: 'Documento', cell: (supplier) => supplier.document ?? '-' },
  {
    key: 'contact',
    header: 'Contato',
    cell: (supplier) => (
      <div>
        <div>{supplier.phone ?? '-'}</div>
        {supplier.email ? <div className="text-xs text-ink-muted">{supplier.email}</div> : null}
      </div>
    ),
  },
];

export default function SuppliersPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(EMPTY);
  const [error, setError] = useState('');

  const { query, page, setPage } = usePagedQuery<Supplier>('suppliers', '/suppliers', {
    search: debouncedSearch,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = JSON.stringify(form);
      if (editing) {
        await apiFetch(`/suppliers/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/suppliers', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      toast.success(editing ? 'Fornecedor atualizado' : 'Fornecedor cadastrado');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/suppliers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor excluído');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
  });

  function openCreate(): void {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setOpen(true);
  }

  function openEdit(supplier: Supplier): void {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      document: supplier.document ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      notes: supplier.notes ?? '',
    });
    setError('');
    setOpen(true);
  }

  async function confirmRemove(supplier: Supplier): Promise<void> {
    const ok = await confirm({
      title: 'Excluir fornecedor',
      description: `"${supplier.name}" deixará de aparecer nas listas. Compras já lançadas são preservadas.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(supplier.id);
  }

  function set<K extends keyof SupplierForm>(key: K, value: SupplierForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canCreate = hasPermission(granted, 'supplier.create');
  const canEdit = hasPermission(granted, 'supplier.edit');
  const canDelete = hasPermission(granted, 'supplier.delete');

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        subtitle="Cadastro de fornecedores de peças e serviços"
        actions={canCreate ? <Button onClick={openCreate}>Novo fornecedor</Button> : null}
      />

      <Card className="p-4">
        <SearchInput
          className="mb-3"
          aria-label="Buscar fornecedores"
          placeholder="Buscar por nome ou documento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(supplier) => supplier.id}
          page={page}
          onPageChange={setPage}
          onRowClick={canEdit ? openEdit : undefined}
          rowActions={(supplier) => [
            { label: 'Editar', onSelect: () => openEdit(supplier), hidden: !canEdit },
            {
              label: 'Excluir',
              onSelect: () => void confirmRemove(supplier),
              danger: true,
              hidden: !canDelete,
            },
          ]}
          emptyMessage={
            debouncedSearch
              ? 'Nenhum fornecedor encontrado para essa busca.'
              : 'Nenhum fornecedor cadastrado ainda.'
          }
          emptyAction={
            !debouncedSearch && canCreate ? (
              <Button onClick={openCreate}>Cadastrar o primeiro fornecedor</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar fornecedor' : 'Novo fornecedor'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="supplier-form" disabled={save.isPending || !form.name}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="supplier-form"
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
            <Field label="Documento (CNPJ/CPF)">
              <Input value={form.document} onChange={(e) => set('document', e.target.value)} />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </Field>
            <Field label="Telefone">
              <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
          </div>
          <Field label="Observações">
            <Textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
