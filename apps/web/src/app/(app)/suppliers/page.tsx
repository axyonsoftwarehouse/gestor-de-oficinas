'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Supplier } from '@/lib/types';
import {
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

export default function SuppliersPage(): JSX.Element {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(EMPTY);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () =>
      apiFetch<Paginated<Supplier>>(`/suppliers${buildQuery({ search })}`),
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
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/suppliers/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
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

  function set<K extends keyof SupplierForm>(key: K, value: SupplierForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        subtitle="Cadastro de fornecedores de peças e serviços"
        actions={<Button onClick={openCreate}>Novo fornecedor</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-sm">
          <Input
            placeholder="Buscar por nome ou documento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhum fornecedor encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Nome</Th>
                  <Th>Documento</Th>
                  <Th>E-mail</Th>
                  <Th>Telefone</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-slate-100">
                    <Td>{supplier.name}</Td>
                    <Td>{supplier.document ?? '-'}</Td>
                    <Td>{supplier.email ?? '-'}</Td>
                    <Td>{supplier.phone ?? '-'}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(supplier)}>
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={async () => {
                            if (await confirm({ title: `Excluir ${supplier.name}?`, confirmLabel: 'Excluir', tone: 'danger' })) {
                              remove.mutate(supplier.id);
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
        title={editing ? 'Editar fornecedor' : 'Novo fornecedor'}
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
          <Field label="Documento (CNPJ/CPF)">
            <Input value={form.document} onChange={(e) => set('document', e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Telefone">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Field label="Observações">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
