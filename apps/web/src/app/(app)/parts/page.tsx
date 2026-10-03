'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Part } from '@/lib/types';
import { formatMoney } from '@/lib/format';
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
} from '@/components/ui';

interface PartForm {
  name: string;
  sku: string;
  costPrice: string;
  salePrice: string;
  minStock: string;
}

const EMPTY: PartForm = { name: '', sku: '', costPrice: '', salePrice: '', minStock: '' };

export default function PartsPage(): JSX.Element {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [form, setForm] = useState<PartForm>(EMPTY);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['parts', search],
    queryFn: () => apiFetch<Paginated<Part>>(`/parts${buildQuery({ search })}`),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        sku: form.sku || undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        minStock: form.minStock ? Number(form.minStock) : undefined,
      };
      const body = JSON.stringify(payload);
      if (editing) {
        await apiFetch(`/parts/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/parts', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts'] });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/parts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parts'] }),
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

  return (
    <div>
      <PageHeader
        title="Peças e serviços"
        subtitle="Catálogo de itens"
        actions={<Button onClick={openCreate}>Nova peça</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-sm">
          <Input
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhuma peça encontrada." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Nome</Th>
                <Th>SKU</Th>
                <Th className="text-right">Custo</Th>
                <Th className="text-right">Venda</Th>
                <Th className="text-right">Estoque mín.</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((part) => (
                <tr key={part.id} className="border-b border-slate-100">
                  <Td>{part.name}</Td>
                  <Td>{part.sku ?? '-'}</Td>
                  <Td className="text-right">{formatMoney(part.costPrice)}</Td>
                  <Td className="text-right">{formatMoney(part.salePrice)}</Td>
                  <Td className="text-right">{String(part.minStock)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(part)}>Editar</Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (window.confirm('Excluir peça?')) remove.mutate(part.id);
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
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar peça' : 'Nova peça'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="SKU">
            <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
          </Field>
          <Field label="Custo">
            <Input type="number" value={form.costPrice} onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))} />
          </Field>
          <Field label="Venda">
            <Input type="number" value={form.salePrice} onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))} />
          </Field>
          <Field label="Estoque mínimo">
            <Input type="number" value={form.minStock} onChange={(e) => setForm((p) => ({ ...p, minStock: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
