'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Customer, Paginated } from '@/lib/types';
import {
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

export default function CustomersPage(): JSX.Element {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () =>
      apiFetch<Paginated<Customer>>(`/customers${buildQuery({ search })}`),
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
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
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
      state: '',
      zip: '',
    });
    setError('');
    setOpen(true);
  }

  function set<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro de clientes da oficina"
        actions={<Button onClick={openCreate}>Novo cliente</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-sm">
          <Input
            placeholder="Buscar por nome, documento, e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhum cliente encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Nome</Th>
                  <Th>Documento</Th>
                  <Th>E-mail</Th>
                  <Th>Telefone</Th>
                  <Th>Cidade</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100">
                    <Td>{customer.name}</Td>
                    <Td>{customer.document ?? '-'}</Td>
                    <Td>{customer.email ?? '-'}</Td>
                    <Td>{customer.phone ?? '-'}</Td>
                    <Td>{customer.city ?? '-'}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(customer)}>
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (window.confirm(`Excluir ${customer.name}?`)) {
                              remove.mutate(customer.id);
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
        title={editing ? 'Editar cliente' : 'Novo cliente'}
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
          <Field label="Tipo">
            <Select
              value={form.type}
              onChange={(e) => set('type', e.target.value as CustomerForm['type'])}
            >
              <option value="INDIVIDUAL">Pessoa física</option>
              <option value="COMPANY">Pessoa jurídica</option>
            </Select>
          </Field>
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Documento (CPF/CNPJ)">
            <Input value={form.document} onChange={(e) => set('document', e.target.value)} />
          </Field>
          <Field label="Telefone">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Cidade">
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="UF">
            <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="CEP">
            <Input value={form.zip} onChange={(e) => set('zip', e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
