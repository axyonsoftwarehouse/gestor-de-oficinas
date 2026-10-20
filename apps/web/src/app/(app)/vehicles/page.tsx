'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import type { Vehicle } from '@/lib/types';
import { useCustomers } from '@/lib/queries';
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
  Select,
} from '@/components/ui';

interface VehicleForm {
  customerId: string;
  plate: string;
  vin: string;
  year: string;
  odometer: string;
}

const EMPTY: VehicleForm = {
  customerId: '',
  plate: '',
  vin: '',
  year: '',
  odometer: '',
};

const COLUMNS: Column<Vehicle>[] = [
  {
    key: 'plate',
    header: 'Placa',
    cell: (vehicle) => (
      <span className="font-mono text-xs font-medium uppercase">{vehicle.plate ?? '-'}</span>
    ),
  },
  { key: 'customer', header: 'Cliente', cell: (vehicle) => vehicle.customer?.name ?? '-' },
  {
    key: 'model',
    header: 'Marca / Modelo',
    cell: (vehicle) =>
      [vehicle.brand?.name, vehicle.model?.name].filter(Boolean).join(' ') || '-',
  },
  { key: 'year', header: 'Ano', cell: (vehicle) => vehicle.year ?? '-' },
  {
    key: 'odometer',
    header: 'Odômetro',
    align: 'right',
    cell: (vehicle) =>
      vehicle.odometer ? `${Number(vehicle.odometer).toLocaleString('pt-BR')} km` : '-',
  },
];

export default function VehiclesPage(): JSX.Element {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(EMPTY);
  const [error, setError] = useState('');

  const customers = useCustomers();
  const { query, page, setPage } = usePagedQuery<Vehicle>('vehicles', '/vehicles', {
    search: debouncedSearch,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = JSON.stringify({
        customerId: form.customerId,
        plate: form.plate || undefined,
        vin: form.vin || undefined,
        year: form.year ? Number(form.year) : undefined,
        odometer: form.odometer ? Number(form.odometer) : undefined,
      });
      if (editing) {
        await apiFetch(`/vehicles/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/vehicles', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      setOpen(false);
      toast.success(editing ? 'Veículo atualizado' : 'Veículo cadastrado');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo excluído');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir'),
  });

  function openCreate(): void {
    setEditing(null);
    setForm({ ...EMPTY, customerId: customers.data?.items[0]?.id ?? '' });
    setError('');
    setOpen(true);
  }

  function openEdit(vehicle: Vehicle): void {
    setEditing(vehicle);
    setForm({
      customerId: vehicle.customerId,
      plate: vehicle.plate ?? '',
      vin: vehicle.vin ?? '',
      year: vehicle.year ? String(vehicle.year) : '',
      odometer: vehicle.odometer ? String(vehicle.odometer) : '',
    });
    setError('');
    setOpen(true);
  }

  async function confirmRemove(vehicle: Vehicle): Promise<void> {
    const ok = await confirm({
      title: 'Excluir veículo',
      description: `O veículo ${vehicle.plate ?? ''} deixará de aparecer nas listas. O histórico de OS é preservado.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (ok) remove.mutate(vehicle.id);
  }

  function set<K extends keyof VehicleForm>(key: K, value: VehicleForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canCreate = hasPermission(granted, 'vehicle.create');
  const canEdit = hasPermission(granted, 'vehicle.edit');
  const canDelete = hasPermission(granted, 'vehicle.delete');
  const canSave = Boolean(form.customerId && form.plate) && !save.isPending;

  return (
    <div>
      <PageHeader
        title="Veículos"
        subtitle="Frota de clientes"
        actions={canCreate ? <Button onClick={openCreate}>Novo veículo</Button> : null}
      />

      <Card className="p-4">
        <SearchInput
          className="mb-3"
          aria-label="Buscar veículos"
          placeholder="Buscar por placa, VIN, chassi…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <DataTable
          query={query}
          columns={COLUMNS}
          rowKey={(vehicle) => vehicle.id}
          page={page}
          onPageChange={setPage}
          onRowClick={canEdit ? openEdit : undefined}
          rowActions={(vehicle) => [
            { label: 'Editar', onSelect: () => openEdit(vehicle), hidden: !canEdit },
            {
              label: 'Excluir',
              onSelect: () => void confirmRemove(vehicle),
              danger: true,
              hidden: !canDelete,
            },
          ]}
          emptyMessage={
            debouncedSearch
              ? 'Nenhum veículo encontrado para essa busca.'
              : 'Nenhum veículo cadastrado ainda.'
          }
          emptyAction={
            !debouncedSearch && canCreate ? (
              <Button onClick={openCreate}>Cadastrar o primeiro veículo</Button>
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar veículo' : 'Novo veículo'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="vehicle-form" disabled={!canSave}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form
          id="vehicle-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) save.mutate();
          }}
        >
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cliente">
              <Select
                required
                value={form.customerId}
                onChange={(e) => set('customerId', e.target.value)}
              >
                <option value="">Selecione…</option>
                {customers.data?.items.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Placa">
              <Input
                required
                value={form.plate}
                onChange={(e) => set('plate', e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="VIN">
              <Input value={form.vin} onChange={(e) => set('vin', e.target.value)} />
            </Field>
            <Field label="Ano">
              <Input
                type="number"
                inputMode="numeric"
                value={form.year}
                onChange={(e) => set('year', e.target.value)}
              />
            </Field>
            <Field label="Odômetro (km)">
              <Input
                type="number"
                inputMode="numeric"
                value={form.odometer}
                onChange={(e) => set('odometer', e.target.value)}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
