'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Part, Purchase, StockLocation, Supplier } from '@/lib/types';
import { useBranches } from '@/lib/queries';
import { formatDate, formatMoney } from '@/lib/format';
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

interface ItemRow {
  partId: string;
  quantity: string;
  unitCost: string;
}

export default function PurchasesPage(): JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    branchId: '',
    locationId: '',
    supplierId: '',
    purchaseDate: '',
  });
  const [items, setItems] = useState<ItemRow[]>([{ partId: '', quantity: '1', unitCost: '' }]);

  const branches = useBranches();
  const locations = useQuery({
    queryKey: ['stock-locations'],
    queryFn: () => apiFetch<StockLocation[]>('/stock/locations'),
  });
  const suppliers = useQuery({
    queryKey: ['suppliers', 'options'],
    queryFn: () => apiFetch<Paginated<Supplier>>(`/suppliers${buildQuery({ pageSize: 100 })}`),
  });
  const parts = useQuery({
    queryKey: ['parts', 'options'],
    queryFn: () => apiFetch<Paginated<Part>>(`/parts${buildQuery({ pageSize: 100 })}`),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => apiFetch<Paginated<Purchase>>(`/purchases${buildQuery({ pageSize: 50 })}`),
  });

  const create = useMutation({
    mutationFn: async () => {
      await apiFetch('/purchases', {
        method: 'POST',
        body: JSON.stringify({
          branchId: form.branchId,
          locationId: form.locationId,
          supplierId: form.supplierId || undefined,
          purchaseDate: form.purchaseDate
            ? new Date(form.purchaseDate).toISOString()
            : undefined,
          items: items
            .filter((item) => item.partId)
            .map((item) => ({
              partId: item.partId,
              quantity: Number(item.quantity) || 1,
              unitCost: Number(item.unitCost) || 0,
            })),
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['stock-balances'] });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  function openCreate(): void {
    setError('');
    setForm({
      branchId: branches.data?.[0]?.id ?? '',
      locationId: '',
      supplierId: '',
      purchaseDate: '',
    });
    setItems([{ partId: '', quantity: '1', unitCost: '' }]);
    setOpen(true);
  }

  function updateItem(index: number, patch: Partial<ItemRow>): void {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  const validItems = items.filter((item) => item.partId);

  return (
    <div>
      <PageHeader
        title="Compras"
        subtitle="Entradas de estoque e despesas"
        actions={<Button onClick={openCreate}>Nova compra</Button>}
      />

      <Card className="p-4">
        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhuma compra registrada." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Número</Th>
                <Th>Data</Th>
                <Th>Fornecedor</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((purchase) => (
                <tr key={purchase.id} className="border-b border-slate-100">
                  <Td>{purchase.number}</Td>
                  <Td>{formatDate(purchase.purchaseDate)}</Td>
                  <Td>{purchase.supplier?.name ?? '-'}</Td>
                  <Td><Badge>{purchase.status}</Badge></Td>
                  <Td className="text-right">{formatMoney(purchase.total)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova compra"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.branchId || !form.locationId || validItems.length === 0}
            >
              {create.isPending ? 'Salvando…' : 'Registrar compra'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Filial">
            <Select value={form.branchId} onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}>
              <option value="">Selecione…</option>
              {branches.data?.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Local de estoque">
            <Select value={form.locationId} onChange={(e) => setForm((p) => ({ ...p, locationId: e.target.value }))}>
              <option value="">Selecione…</option>
              {locations.data?.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fornecedor">
            <Select value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))}>
              <option value="">Sem fornecedor</option>
              {suppliers.data?.items.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Data">
            <Input type="date" value={form.purchaseDate} onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))} />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-600">Itens</div>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <Select value={item.partId} onChange={(e) => updateItem(index, { partId: e.target.value })}>
                  <option value="">Peça…</option>
                  {parts.data?.items.map((part) => (
                    <option key={part.id} value={part.id}>{part.name}</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  placeholder="Custo"
                  value={item.unitCost}
                  onChange={(e) => updateItem(index, { unitCost: e.target.value })}
                />
              </div>
              <div className="col-span-1 flex items-center">
                <button
                  type="button"
                  className="text-slate-400 hover:text-red-600"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() => setItems((prev) => [...prev, { partId: '', quantity: '1', unitCost: '' }])}
          >
            Adicionar item
          </Button>
        </div>
      </Modal>
    </div>
  );
}
