'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { CUSTOMER_TYPE, enumLabel, enumOptions } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import type { Customer } from '@/lib/types';
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
  Select,
} from '@/components/ui';

interface CustomerForm {
  type: 'INDIVIDUAL' | 'COMPANY';
  name: string;
  document: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
}

const EMPTY: CustomerForm = {
  type: 'INDIVIDUAL',
  name: '',
  document: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  zip: '',
};

const COLUMNS: Column<Customer>[] = [
  {
    key: 'name',
    header: 'Nome',
    cell: (customer) => (
      <div>
        <div className="font-medium">{customer.name}</div>
        <div className="text-xs text-ink-muted">{enumLabel(CUSTOMER_TYPE, customer.type)}</div>
      </div>
    ),
  },
  { key: 'document', header: 'Documento', cell: (customer) => customer.document ?? '-' },
  {
    key: 'contact',
    header: 'Contato',
    cell: (customer) => (
      <div>
        <div>{customer.phone ?? '-'}</div>
        {customer.email ? <div className="text-xs text-ink-muted">{customer.email}</div> : null}
      </div>
    ),
  },
  {
    key: 'city',
    header: 'Cidade',
    cell: (customer) =>
      customer.city ? `${customer.city}${customer.state ? `/${customer.state}` : ''}` : '-',
  },
];

export default function CustomersPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY);
  const [error, setError] = useState('');

  const { query, page, setPage } = usePagedQuery<Customer>('customers', '/customers', {
    search: debouncedSearch,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = JSON.stringify(form);
      if (editing) {
        await apiFetch(`/customers/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/customers', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setOpen(false);
      toast.success(editing ? 'Cliente atualizado' : 'Cliente cadastrado');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente excluído');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
  });

  function openCreate(): void {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setOpen(true);
  }

  function openEdit(customer: Customer): void {
    setEditing(customer);
    setForm({
      type: customer.type,
      name: customer.name,
      document: customer.document ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
      zip: customer.zip ?? '',
    });
    setError('');
    setOpen(true);
  }

  async function confirmRemove(customer: Customer): Promise<void> {
    const ok = await confirm({
      title: 'Excluir cliente',
      description: `"${customer.name}" deixará de aparecer nas listas. O histórico de OS e faturas é preservado.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(customer.id);
  }

  function set<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canCreate = hasPermission(granted, 'customer.create');
  const canEdit = hasPermission(granted, 'customer.edit');
  const canDelete = hasPermission(granted, 'customer.delete');

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro de clientes da oficina"
        actions={canCreate ? <Button onClick={openCreate}>Novo cliente</Button> : null}
      />

      <Card className="p-4">
        <div className="relative mb-3 max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <Input
            aria-label="Buscar clientes"
            className="pl-9"
            placeholder="Buscar por nome, documento, e-mail, telefone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(customer) => customer.id}
          page={page}
          onPageChange={setPage}
          onRowClick={canEdit ? openEdit : undefined}
          rowActions={(customer) => [
            { label: 'Editar', onSelect: () => openEdit(customer), hidden: !canEdit },
            {
              label: 'Excluir',
              onSelect: () => void confirmRemove(customer),
              danger: true,
              hidden: !canDelete,
            },
          ]}
          emptyMessage={
            debouncedSearch ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'
          }
          emptyAction={
            !debouncedSearch && canCreate ? (
              <Button onClick={openCreate}>Cadastrar o primeiro cliente</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="customer-form" disabled={save.isPending || !form.name}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="customer-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.name && !save.isPending) save.mutate();
          }}
        >
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select
                value={form.type}
                onChange={(e) => set('type', e.target.value as CustomerForm['type'])}
              >
                {enumOptions(CUSTOMER_TYPE).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nome">
              <Input
                autoFocus
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </Field>
            <Field label={form.type === 'COMPANY' ? 'CNPJ' : 'CPF'}>
              <Input value={form.document} onChange={(e) => set('document', e.target.value)} />
            </Field>
            <Field label="Telefone">
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </Field>
            <Field label="Cidade">
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </Field>
            <Field label="UF">
              <Input
                maxLength={2}
                value={form.state}
                onChange={(e) => set('state', e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="CEP">
              <Input
                inputMode="numeric"
                value={form.zip}
                onChange={(e) => set('zip', e.target.value)}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
