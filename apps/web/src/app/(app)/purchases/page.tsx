'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch, buildQuery } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { PURCHASE_STATUS, enumOptions } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import { useBranches } from '@/lib/queries';
import type { Paginated, Part, Purchase, StockLocation, Supplier } from '@/lib/types';
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
  StatusBadge,
} from '@/components/ui';

interface ItemRow {
  partId: string;
  quantity: string;
  unitCost: string;
}

const EMPTY_ITEM: ItemRow = { partId: '', quantity: '1', unitCost: '' };

const COLUMNS: Column<Purchase>[] = [
  {
    key: 'number',
    header: 'Número',
    cell: (purchase) => <span className="font-medium">{purchase.number}</span>,
  },
  { key: 'date', header: 'Data', cell: (purchase) => formatDate(purchase.purchaseDate) },
  { key: 'supplier', header: 'Fornecedor', cell: (purchase) => purchase.supplier?.name ?? '-' },
  {
    key: 'status',
    header: 'Status',
    cell: (purchase) => <StatusBadge map={PURCHASE_STATUS} value={purchase.status} />,
  },
  { key: 'total', header: 'Total', align: 'right', cell: (purchase) => formatMoney(purchase.total) },
];

export default function PurchasesPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    branchId: '',
    locationId: '',
    supplierId: '',
    purchaseDate: '',
  });
  const [items, setItems] = useState<ItemRow[]>([EMPTY_ITEM]);

  const branches = useBranches();
  const locations = useQuery({
    queryKey: ['stock-locations'],
    queryFn: () => apiFetch<StockLocation[]>('/stock/locations'),
    enabled: open,
  });
  const suppliers = useQuery({
    queryKey: ['suppliers', 'options'],
    queryFn: () => apiFetch<Paginated<Supplier>>(`/suppliers${buildQuery({ pageSize: 100 })}`),
    enabled: open,
  });
  const parts = useQuery({
    queryKey: ['parts', 'options'],
    queryFn: () => apiFetch<Paginated<Part>>(`/parts${buildQuery({ pageSize: 100 })}`),
    enabled: open,
  });

  const { query, page, setPage } = usePagedQuery<Purchase>('purchases', '/purchases', {
    status,
  });

  function invalidate(): void {
    qc.invalidateQueries({ queryKey: ['purchases'] });
    qc.invalidateQueries({ queryKey: ['stock-balances'] });
    qc.invalidateQueries({ queryKey: ['stock-movements'] });
    qc.invalidateQueries({ queryKey: ['expenses'] });
  }

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Purchase>('/purchases', {
        method: 'POST',
        body: JSON.stringify({
          branchId: form.branchId,
          locationId: form.locationId,
          supplierId: form.supplierId || undefined,
          purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
          items: items
            .filter((item) => item.partId)
            .map((item) => ({
              partId: item.partId,
              quantity: Number(item.quantity) || 1,
              unitCost: Number(item.unitCost) || 0,
            })),
        }),
      }),
    onSuccess: (purchase) => {
      invalidate();
      setOpen(false);
      toast.success(`Compra ${purchase.number} registrada`);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => apiFetch(`/purchases/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      toast.success('Compra cancelada');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao cancelar'),
  });

  function openCreate(): void {
    setError('');
    setForm({
      branchId: branches.data?.[0]?.id ?? '',
      locationId: '',
      supplierId: '',
      purchaseDate: '',
    });
    setItems([EMPTY_ITEM]);
    setOpen(true);
  }

  async function confirmCancel(purchase: Purchase): Promise<void> {
    const ok = await confirm({
      title: 'Cancelar compra',
      description: `A compra ${purchase.number} será cancelada: as entradas de estoque são estornadas e a despesa vinculada é removida.`,
      confirmLabel: 'Cancelar compra',
      tone: 'danger',
    });
    if (ok) cancel.mutate(purchase.id);
  }

  function updateItem(index: number, patch: Partial<ItemRow>): void {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  const canCreate = hasPermission(granted, 'purchase.create');
  const canCancel = hasPermission(granted, 'purchase.edit');
  const validItems = items.filter((item) => item.partId);
  const canSave =
    Boolean(form.branchId && form.locationId) && validItems.length > 0 && !create.isPending;
  const branchLocations = locations.data?.filter(
    (location) => !form.branchId || location.branchId === form.branchId,
  );

  return (
    <div>
      <PageHeader
        title="Compras"
        subtitle="Entradas de estoque e despesas"
        actions={canCreate ? <Button onClick={openCreate}>Nova compra</Button> : null}
      />

      <Card className="p-4">
        <div className="mb-3 w-full sm:max-w-xs">
          <Select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {enumOptions(PURCHASE_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(purchase) => purchase.id}
          page={page}
          onPageChange={setPage}
          rowActions={(purchase) => [
            {
              label: 'Cancelar compra',
              onSelect: () => void confirmCancel(purchase),
              danger: true,
              hidden: !canCancel || purchase.status === 'CANCELLED',
            },
          ]}
          emptyMessage={status ? 'Nenhuma compra com esse status.' : 'Nenhuma compra registrada ainda.'}
          emptyAction={
            !status && canCreate ? (
              <Button onClick={openCreate}>Registrar a primeira compra</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova compra"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="purchase-form" disabled={!canSave}>
              {create.isPending ? 'Salvando…' : 'Registrar compra'}
            </Button>
          </>
        }
      >
        <form
          id="purchase-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) create.mutate();
          }}
        >
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Filial">
              <Select
                required
                value={form.branchId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, branchId: e.target.value, locationId: '' }))
                }
              >
                <option value="">Selecione…</option>
                {branches.data?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Local de estoque">
              <Select
                required
                value={form.locationId}
                onChange={(e) => setForm((p) => ({ ...p, locationId: e.target.value }))}
              >
                <option value="">Selecione…</option>
                {branchLocations?.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fornecedor">
              <Select
                value={form.supplierId}
                onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))}
              >
                <option value="">Sem fornecedor</option>
                {suppliers.data?.items.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data">
              <Input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))}
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-medium text-ink-muted">Itens</div>
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-2 border-t border-surface-line/70 pt-3 sm:grid-cols-12 sm:border-0 sm:pt-0"
              >
                <div className="col-span-2 sm:col-span-6">
                  <Select
                    aria-label="Peça"
                    value={item.partId}
                    onChange={(e) => updateItem(index, { partId: e.target.value })}
                  >
                    <option value="">Peça…</option>
                    {parts.data?.items.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Input
                    aria-label="Quantidade"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder="Qtd"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 sm:col-span-4">
                  <Input
                    aria-label="Custo unitário"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Custo unit."
                    value={item.unitCost}
                    onChange={(e) => updateItem(index, { unitCost: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label="Remover item"
                    className="rounded-md p-1 text-ink-soft transition hover:bg-surface-page hover:text-state-danger"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setItems((prev) => [...prev, EMPTY_ITEM])}
            >
              Adicionar item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
