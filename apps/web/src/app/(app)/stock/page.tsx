'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch, buildQuery } from '@/lib/api';
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format';
import { STOCK_MOVEMENT_TYPE, enumLabel, enumOptions } from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import { useBranches } from '@/lib/queries';
import type {
  JobCard,
  Paginated,
  Part,
  StockBalance,
  StockLocation,
  StockMovement,
} from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import {
  DataTable,
  useLocalPaged,
  usePagedQuery,
  type Column,
} from '@/components/data-table';
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  StatusBadge,
} from '@/components/ui';

/** Tipos que podem ser lançados manualmente (compras e baixas têm fluxo próprio). */
const MANUAL_MOVEMENT_TYPES = ['INITIAL', 'PURCHASE', 'ADJUSTMENT', 'SALE', 'RETURN_IN'];

const EMPTY_MOVEMENT = { locationId: '', partId: '', type: 'INITIAL', quantity: '', unitCost: '' };
const EMPTY_ISSUE = { locationId: '', partId: '', quantity: '', jobCardId: '', addToJob: true };

const BALANCE_COLUMNS: Column<StockBalance>[] = [
  {
    key: 'part',
    header: 'Peça',
    cell: (balance) => (
      <div>
        <div className="font-medium">{balance.part.name}</div>
        {balance.part.sku ? <div className="text-xs text-ink-muted">{balance.part.sku}</div> : null}
      </div>
    ),
  },
  { key: 'location', header: 'Local', cell: (balance) => balance.location.name },
  {
    key: 'quantity',
    header: 'Quantidade',
    align: 'right',
    cell: (balance) => {
      const low = Number(balance.quantity) < Number(balance.part.minStock);
      return (
        <span className="inline-flex items-center gap-2">
          {low ? <Badge tone="amber">Abaixo do mínimo</Badge> : null}
          {formatNumber(balance.quantity, 3)}
        </span>
      );
    },
  },
];

const MOVEMENT_COLUMNS: Column<StockMovement>[] = [
  {
    key: 'date',
    header: 'Data',
    cell: (movement) => (
      <span className="whitespace-nowrap">{formatDateTime(movement.createdAt)}</span>
    ),
  },
  {
    key: 'type',
    header: 'Tipo',
    cell: (movement) => <StatusBadge map={STOCK_MOVEMENT_TYPE} value={movement.type} />,
  },
  { key: 'part', header: 'Peça', cell: (movement) => movement.part?.name ?? '-' },
  { key: 'location', header: 'Local', cell: (movement) => movement.location?.name ?? '-' },
  {
    key: 'quantity',
    header: 'Qtd.',
    align: 'right',
    cell: (movement) => {
      const quantity = Number(movement.quantity);
      return (
        <span className={quantity < 0 ? 'text-state-danger' : 'text-state-success'}>
          {quantity > 0 ? '+' : ''}
          {formatNumber(quantity, 3)}
        </span>
      );
    },
  },
  {
    key: 'cost',
    header: 'Custo unit.',
    align: 'right',
    cell: (movement) => (movement.unitCost != null ? formatMoney(movement.unitCost) : '-'),
  },
];

export default function StockPage(): JSX.Element {
  const qc = useQueryClient();
  const { session } = useAuth();
  const granted = session?.permissions ?? [];
  const branches = useBranches();
  const [lowStock, setLowStock] = useState(false);
  const [movementType, setMovementType] = useState('');
  const [locationForm, setLocationForm] = useState({ branchId: '', name: '' });
  const [movement, setMovement] = useState(EMPTY_MOVEMENT);
  const [issue, setIssue] = useState(EMPTY_ISSUE);

  const canCreate = hasPermission(granted, 'stock.create');

  const locations = useQuery({
    queryKey: ['stock-locations'],
    queryFn: () => apiFetch<StockLocation[]>('/stock/locations'),
  });
  // O endpoint de saldos devolve a lista inteira; a paginação é feita no cliente.
  const balancesSource = useQuery({
    queryKey: ['stock-balances', { lowStock }],
    queryFn: () =>
      apiFetch<StockBalance[]>(`/stock/balances${buildQuery({ lowStock: lowStock || undefined })}`),
  });
  const balances = useLocalPaged(balancesSource, 15);
  const movements = usePagedQuery<StockMovement>(
    'stock-movements',
    '/stock/movements',
    { type: movementType },
    15,
  );
  const parts = useQuery({
    queryKey: ['parts', 'options'],
    queryFn: () => apiFetch<Paginated<Part>>(`/parts${buildQuery({ pageSize: 100 })}`),
    enabled: canCreate,
  });
  const jobCards = useQuery({
    queryKey: ['job-cards', 'options'],
    queryFn: () => apiFetch<Paginated<JobCard>>(`/job-cards${buildQuery({ pageSize: 100 })}`),
    enabled: canCreate,
  });

  function invalidateLedger(): void {
    qc.invalidateQueries({ queryKey: ['stock-balances'] });
    qc.invalidateQueries({ queryKey: ['stock-movements'] });
  }

  const createLocation = useMutation({
    mutationFn: () =>
      apiFetch('/stock/locations', { method: 'POST', body: JSON.stringify(locationForm) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-locations'] });
      setLocationForm({ branchId: '', name: '' });
      toast.success('Local de estoque criado');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar local'),
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
      invalidateLedger();
      setMovement(EMPTY_MOVEMENT);
      toast.success('Movimentação registrada');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao movimentar'),
  });

  const issueToJob = useMutation({
    mutationFn: () =>
      apiFetch('/stock/issues', {
        method: 'POST',
        body: JSON.stringify({
          locationId: issue.locationId,
          partId: issue.partId,
          quantity: Number(issue.quantity),
          jobCardId: issue.jobCardId,
          addToJob: issue.addToJob,
        }),
      }),
    onSuccess: () => {
      invalidateLedger();
      qc.invalidateQueries({ queryKey: ['job-cards'] });
      setIssue(EMPTY_ISSUE);
      toast.success('Baixa para OS registrada');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao dar baixa'),
  });

  const canMove =
    Boolean(movement.locationId && movement.partId && movement.quantity) &&
    !createMovement.isPending;
  const canIssue =
    Boolean(issue.locationId && issue.partId && issue.quantity && issue.jobCardId) &&
    !issueToJob.isPending;
  const canCreateLocation =
    Boolean(locationForm.branchId && locationForm.name) && !createLocation.isPending;

  const locationOptions = locations.data?.map((location) => (
    <option key={location.id} value={location.id}>
      {location.name}
    </option>
  ));
  const partOptions = parts.data?.items.map((part) => (
    <option key={part.id} value={part.id}>
      {part.name}
    </option>
  ));

  return (
    <div>
      <PageHeader title="Estoque" subtitle="Saldos e movimentações" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Saldos</h2>
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  checked={lowStock}
                  onChange={(e) => setLowStock(e.target.checked)}
                />
                Somente abaixo do mínimo
              </label>
            </div>
            <DataTable
              query={balances.query}
              columns={BALANCE_COLUMNS}
              rowKey={(balance) => balance.id}
              page={balances.page}
              onPageChange={balances.setPage}
              emptyMessage={
                lowStock ? 'Nenhuma peça abaixo do estoque mínimo.' : 'Sem saldos registrados.'
              }
            />
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Movimentações</h2>
              <div className="w-full sm:max-w-[220px]">
                <Select
                  aria-label="Filtrar por tipo"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  {enumOptions(STOCK_MOVEMENT_TYPE).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <DataTable
              query={movements.query}
              columns={MOVEMENT_COLUMNS}
              rowKey={(item) => item.id}
              page={movements.page}
              onPageChange={movements.setPage}
              emptyMessage={
                movementType
                  ? 'Nenhuma movimentação desse tipo.'
                  : 'Nenhuma movimentação registrada ainda.'
              }
            />
          </Card>
        </div>

        {canCreate ? (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-ink">Movimentar</h2>
              <form
                className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canMove) createMovement.mutate();
                }}
              >
                <Field label="Local">
                  <Select
                    required
                    value={movement.locationId}
                    onChange={(e) => setMovement((p) => ({ ...p, locationId: e.target.value }))}
                  >
                    <option value="">Selecione…</option>
                    {locationOptions}
                  </Select>
                </Field>
                <Field label="Peça">
                  <Select
                    required
                    value={movement.partId}
                    onChange={(e) => setMovement((p) => ({ ...p, partId: e.target.value }))}
                  >
                    <option value="">Selecione…</option>
                    {partOptions}
                  </Select>
                </Field>
                <Field
                  label="Tipo"
                  hint={movement.type === 'ADJUSTMENT' ? 'Aceita quantidade negativa.' : undefined}
                >
                  <Select
                    value={movement.type}
                    onChange={(e) => setMovement((p) => ({ ...p, type: e.target.value }))}
                  >
                    {MANUAL_MOVEMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {enumLabel(STOCK_MOVEMENT_TYPE, type)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Quantidade">
                  <Input
                    required
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={movement.quantity}
                    onChange={(e) => setMovement((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </Field>
                <Field label="Custo unitário">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={movement.unitCost}
                    onChange={(e) => setMovement((p) => ({ ...p, unitCost: e.target.value }))}
                  />
                </Field>
                <Button type="submit" disabled={!canMove} className="w-full sm:col-span-2 lg:col-span-1">
                  {createMovement.isPending ? 'Registrando…' : 'Registrar'}
                </Button>
              </form>
            </Card>

            <Card className="p-4">
              <h2 className="text-sm font-semibold text-ink">Baixar para OS</h2>
              <form
                className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canIssue) issueToJob.mutate();
                }}
              >
                <Field label="Local">
                  <Select
                    required
                    value={issue.locationId}
                    onChange={(e) => setIssue((p) => ({ ...p, locationId: e.target.value }))}
                  >
                    <option value="">Selecione…</option>
                    {locationOptions}
                  </Select>
                </Field>
                <Field label="Peça">
                  <Select
                    required
                    value={issue.partId}
                    onChange={(e) => setIssue((p) => ({ ...p, partId: e.target.value }))}
                  >
                    <option value="">Selecione…</option>
                    {partOptions}
                  </Select>
                </Field>
                <Field label="OS">
                  <Select
                    required
                    value={issue.jobCardId}
                    onChange={(e) => setIssue((p) => ({ ...p, jobCardId: e.target.value }))}
                  >
                    <option value="">Selecione…</option>
                    {jobCards.data?.items.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.number} · {job.customer?.name ?? ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Quantidade">
                  <Input
                    required
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={issue.quantity}
                    onChange={(e) => setIssue((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2 lg:col-span-1">
                  <input
                    type="checkbox"
                    checked={issue.addToJob}
                    onChange={(e) => setIssue((p) => ({ ...p, addToJob: e.target.checked }))}
                  />
                  Adicionar a peça como item da OS
                </label>
                <Button type="submit" disabled={!canIssue} className="w-full sm:col-span-2 lg:col-span-1">
                  {issueToJob.isPending ? 'Registrando…' : 'Dar baixa'}
                </Button>
              </form>
            </Card>

            <Card className="p-4">
              <h2 className="text-sm font-semibold text-ink">Locais de estoque</h2>
              <form
                className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canCreateLocation) createLocation.mutate();
                }}
              >
                <Field label="Filial">
                  <Select
                    required
                    value={locationForm.branchId}
                    onChange={(e) => setLocationForm((p) => ({ ...p, branchId: e.target.value }))}
                  >
                    <option value="">Selecione…</option>
                    {branches.data?.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nome">
                  <Input
                    required
                    value={locationForm.name}
                    onChange={(e) => setLocationForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!canCreateLocation}
                  className="w-full sm:col-span-2 lg:col-span-1"
                >
                  {createLocation.isPending ? 'Criando…' : 'Criar local'}
                </Button>
              </form>
              {locations.data && locations.data.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-surface-line pt-3 text-sm text-ink-muted">
                  {locations.data.map((location) => (
                    <li key={location.id}>{location.name}</li>
                  ))}
                </ul>
              ) : null}
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
