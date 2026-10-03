'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Vehicle } from '@/lib/types';
import { useCustomers } from '@/lib/queries';
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

export default function VehiclesPage(): JSX.Element {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(EMPTY);
  const [error, setError] = useState('');

  const customers = useCustomers();
  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search],
    queryFn: () =>
      apiFetch<Paginated<Vehicle>>(`/vehicles${buildQuery({ search })}`),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        customerId: form.customerId,
        plate: form.plate || undefined,
        vin: form.vin || undefined,
        year: form.year ? Number(form.year) : undefined,
        odometer: form.odometer ? Number(form.odometer) : undefined,
      };
      const body = JSON.stringify(payload);
      if (editing) {
        await apiFetch(`/vehicles/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/vehicles', { method: 'POST', body });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
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

  function set<K extends keyof VehicleForm>(key: K, value: VehicleForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        title="Veículos"
        subtitle="Frota de clientes"
        actions={<Button onClick={openCreate}>Novo veículo</Button>}
      />

      <Card className="p-4">
        <div className="mb-3 max-w-sm">
          <Input
            placeholder="Buscar por placa, VIN, chassi…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message="Nenhum veículo encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Placa</Th>
                  <Th>Cliente</Th>
                  <Th>Marca / Modelo</Th>
                  <Th>Ano</Th>
                  <Th>Odômetro</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-slate-100">
                    <Td>{vehicle.plate ?? '-'}</Td>
                    <Td>{vehicle.customer?.name ?? '-'}</Td>
                    <Td>
                      {[vehicle.brand?.name, vehicle.model?.name]
                        .filter(Boolean)
                        .join(' ') || '-'}
                    </Td>
                    <Td>{vehicle.year ?? '-'}</Td>
                    <Td>{vehicle.odometer ? String(vehicle.odometer) : '-'}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(vehicle)}>
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (window.confirm('Excluir veículo?')) remove.mutate(vehicle.id);
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
        title={editing ? 'Editar veículo' : 'Novo veículo'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || !form.customerId || !form.plate}
            >
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <ErrorText>{error}</ErrorText>
        <Field label="Cliente">
          <Select
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Placa">
            <Input value={form.plate} onChange={(e) => set('plate', e.target.value)} />
          </Field>
          <Field label="VIN">
            <Input value={form.vin} onChange={(e) => set('vin', e.target.value)} />
          </Field>
          <Field label="Ano">
            <Input
              type="number"
              value={form.year}
              onChange={(e) => set('year', e.target.value)}
            />
          </Field>
          <Field label="Odômetro">
            <Input
              type="number"
              value={form.odometer}
              onChange={(e) => set('odometer', e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
