'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Part, StockBalance, StockLocation } from '@/lib/types';
import { useBranches } from '@/lib/queries';
import { formatNumber } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  ErrorText,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  Td,
  Th,
} from '@/components/ui';

export default function StockPage(): JSX.Element {
  const qc = useQueryClient();
  const branches = useBranches();
  const [error, setError] = useState('');
  const [locationForm, setLocationForm] = useState({ branchId: '', name: '' });
  const [movement, setMovement] = useState({
    locationId: '',
    partId: '',
    type: 'PURCHASE',
    quantity: '',
    unitCost: '',
  });

  const locations = useQuery({
    queryKey: ['stock-locations'],
    queryFn: () => apiFetch<StockLocation[]>('/stock/locations'),
  });
  const balances = useQuery({
    queryKey: ['stock-balances'],
    queryFn: () => apiFetch<StockBalance[]>('/stock/balances'),
  });
  const parts = useQuery({
    queryKey: ['parts', 'options'],
    queryFn: () => apiFetch<Paginated<Part>>(`/parts${buildQuery({ pageSize: 100 })}`),
  });

  const createLocation = useMutation({
    mutationFn: () =>
      apiFetch('/stock/locations', {
        method: 'POST',
        body: JSON.stringify(locationForm),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-locations'] });
      setLocationForm({ branchId: '', name: '' });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  const createMovement = useMutation({
    mutationFn: () =>
      apiFetch('/stock/movements', {
        method: 'POST',
        body: JSON.stringify({
          locationId: movement.locationId,
          partId: movement.partId,
          type: movement.type,
          quantity: Number(movement.quantity),
          unitCost: movement.unitCost ? Number(movement.unitCost) : undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-balances'] });
      setMovement({ locationId: '', partId: '', type: 'PURCHASE', quantity: '', unitCost: '' });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro'),
  });

  return (
    <div>
      <PageHeader title="Estoque" subtitle="Saldos e movimentações" />
      <ErrorText>{error}</ErrorText>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Saldos</h2>
          {balances.isLoading ? (
            <Spinner />
          ) : !balances.data || balances.data.length === 0 ? (
            <EmptyState message="Sem saldos registrados." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Peça</Th>
                  <Th>Local</Th>
                  <Th className="text-right">Quantidade</Th>
                </tr>
              </thead>
              <tbody>
                {balances.data.map((balance) => (
                  <tr key={balance.id} className="border-b border-slate-100">
                    <Td>{balance.part.name}</Td>
                    <Td>{balance.location.name}</Td>
                    <Td className="text-right">{formatNumber(balance.quantity, 3)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-800">Movimentar</h2>
            <div className="mt-3 space-y-3">
              <Field label="Local">
                <Select value={movement.locationId} onChange={(e) => setMovement((p) => ({ ...p, locationId: e.target.value }))}>
                  <option value="">Selecione…</option>
                  {locations.data?.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Peça">
                <Select value={movement.partId} onChange={(e) => setMovement((p) => ({ ...p, partId: e.target.value }))}>
                  <option value="">Selecione…</option>
                  {parts.data?.items.map((part) => (
                    <option key={part.id} value={part.id}>{part.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Tipo">
                <Select value={movement.type} onChange={(e) => setMovement((p) => ({ ...p, type: e.target.value }))}>
                  <option value="PURCHASE">Compra (entrada)</option>
                  <option value="INITIAL">Saldo inicial</option>
                  <option value="ADJUSTMENT">Ajuste (aceita negativo)</option>
                  <option value="SALE">Venda (saída)</option>
                  <option value="RETURN_IN">Devolução (entrada)</option>
                </Select>
              </Field>
              <Field label="Quantidade">
                <Input type="number" value={movement.quantity} onChange={(e) => setMovement((p) => ({ ...p, quantity: e.target.value }))} />
              </Field>
              <Field label="Custo unitário">
                <Input type="number" value={movement.unitCost} onChange={(e) => setMovement((p) => ({ ...p, unitCost: e.target.value }))} />
              </Field>
              <Button
                onClick={() => createMovement.mutate()}
                disabled={createMovement.isPending || !movement.locationId || !movement.partId || !movement.quantity}
                className="w-full"
              >
                Registrar
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-800">Local</h2>
            <div className="mt-3 space-y-3">
              <Field label="Filial">
                <Select value={locationForm.branchId} onChange={(e) => setLocationForm((p) => ({ ...p, branchId: e.target.value }))}>
                  <option value="">Selecione…</option>
                  {branches.data?.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Nome">
                <Input value={locationForm.name} onChange={(e) => setLocationForm((p) => ({ ...p, name: e.target.value }))} />
              </Field>
              <Button
                variant="secondary"
                onClick={() => createLocation.mutate()}
                disabled={createLocation.isPending || !locationForm.branchId || !locationForm.name}
                className="w-full"
              >
                Criar local
              </Button>
              <ul className="text-xs text-slate-500">
                {locations.data?.map((location) => (
                  <li key={location.id}>• {location.name}</li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
