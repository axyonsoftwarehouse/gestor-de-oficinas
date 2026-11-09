'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch, buildQuery } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useBranches, useServices } from '@/lib/queries';
import { useDebounced } from '@/lib/use-debounced';
import type { Customer, JobCard, Paginated, ServiceItem, Vehicle } from '@/lib/types';
import { VehicleCatalogFields } from '@/components/vehicle-catalog-fields';
import { Button, Field, Input, Spinner } from '@/components/ui';

export default function NovaOsPage(): JSX.Element {
  const router = useRouter();
  const qc = useQueryClient();
  const branches = useBranches();

  const [plate, setPlate] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [newPlate, setNewPlate] = useState('');
  const [year, setYear] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [complaint, setComplaint] = useState('');

  const [serviceSearch, setServiceSearch] = useState('');
  // Guarda o objeto, não só o id: a busca pode mudar e o serviço escolhido
  // continua somando no total.
  const [selected, setSelected] = useState<Record<string, ServiceItem>>({});

  const debouncedPlate = useDebounced(plate.trim(), 350);
  const search = useQuery({
    queryKey: ['m', 'vehicle-search', debouncedPlate],
    queryFn: () =>
      apiFetch<Paginated<Vehicle>>(
        `/vehicles${buildQuery({ search: debouncedPlate, pageSize: 6 })}`,
      ),
    enabled: debouncedPlate.length >= 3 && !vehicle,
  });

  const services = useServices(serviceSearch);
  const serviceItems = services.data?.items ?? [];

  const chosen = Object.values(selected);
  const total = chosen.reduce((sum, service) => sum + Number(service.basePrice), 0);

  function toggleService(service: ServiceItem): void {
    setSelected((previous) => {
      const next = { ...previous };
      if (next[service.id]) delete next[service.id];
      else next[service.id] = service;
      return next;
    });
  }

  function pickVehicle(found: Vehicle): void {
    setVehicle(found);
    setCreatingVehicle(false);
    setPlate(found.plate ?? '');
  }

  function resetVehicle(): void {
    setVehicle(null);
    setCreatingVehicle(false);
    setPlate('');
  }

  const save = useMutation({
    mutationFn: async () => {
      const branchId = branches.data?.[0]?.id;
      if (!branchId) throw new Error('Cadastre uma filial antes de abrir a OS.');

      let customerId = vehicle?.customerId;
      let vehicleId = vehicle?.id;

      if (!vehicleId) {
        const plateValue = (newPlate || plate).trim().toUpperCase();
        if (!customerForm.name.trim()) throw new Error('Informe o nome do cliente.');
        if (!plateValue) throw new Error('Informe a placa do veículo.');

        const createdCustomer = await apiFetch<Customer>('/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: customerForm.name.trim(),
            phone: customerForm.phone.trim() || undefined,
          }),
        });
        const createdVehicle = await apiFetch<Vehicle>('/vehicles', {
          method: 'POST',
          body: JSON.stringify({
            customerId: createdCustomer.id,
            plate: plateValue,
            year: year ? Number(year) : undefined,
            brandId: brandId || undefined,
            modelId: modelId || undefined,
          }),
        });
        customerId = createdCustomer.id;
        vehicleId = createdVehicle.id;
      }

      if (!customerId || !vehicleId) throw new Error('Selecione o veículo.');
      if (chosen.length === 0) throw new Error('Adicione pelo menos um serviço.');

      const job = await apiFetch<JobCard>('/job-cards', {
        method: 'POST',
        body: JSON.stringify({
          branchId,
          type: 'REPAIR',
          customerId,
          vehicleId,
          customerComplaint: complaint.trim() || undefined,
        }),
      });

      for (const service of chosen) {
        await apiFetch(`/job-cards/${job.id}/lines`, {
          method: 'POST',
          body: JSON.stringify({
            type: 'SERVICE',
            serviceId: service.id,
            description: service.name,
            quantity: 1,
            unitPrice: Number(service.basePrice),
          }),
        });
      }
      return job;
    },
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ['m', 'job-cards'] });
      toast.success(`OS ${job.number} aberta`);
      router.push(`/m/os/${job.id}`);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Não foi possível abrir a OS'),
  });

  const canSubmit =
    !save.isPending &&
    chosen.length > 0 &&
    Boolean(branches.data?.[0]?.id) &&
    (vehicle ? true : Boolean(customerForm.name.trim() && (newPlate || plate).trim()));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Nova OS</h1>
        <p className="mt-1 text-sm text-ink-muted">Placa, serviços e pronto.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          1. Veículo
        </h2>

        {vehicle ? (
          <div className="rounded-2xl border border-brand/40 bg-brand-soft p-4">
            <div className="font-mono text-xl font-semibold uppercase tracking-wide text-ink">
              {vehicle.plate ?? 'Sem placa'}
            </div>
            <div className="mt-1 text-sm text-ink-muted">
              {vehicle.customer?.name ?? 'Cliente'} · {vehicle.brand?.name ?? ''}{' '}
              {vehicle.model?.name ?? ''} {vehicle.year ?? ''}
            </div>
            <button
              type="button"
              onClick={resetVehicle}
              className="mt-3 text-sm font-medium text-brand underline-offset-2 hover:underline"
            >
              Trocar veículo
            </button>
          </div>
        ) : (
          <>
            <Input
              value={plate}
              onChange={(event) => setPlate(event.target.value.toUpperCase())}
              placeholder="Digite a placa"
              autoCapitalize="characters"
              autoCorrect="off"
              maxLength={8}
              className="h-14 text-center font-mono text-2xl uppercase tracking-[0.2em]"
            />

            {debouncedPlate.length >= 3 ? (
              <div className="space-y-2">
                {search.isLoading ? <Spinner /> : null}
                {search.data?.items.map((found) => (
                  <button
                    key={found.id}
                    type="button"
                    onClick={() => pickVehicle(found)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface p-3 text-left transition active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-base font-semibold uppercase text-ink">
                        {found.plate ?? 'Sem placa'}
                      </div>
                      <div className="truncate text-sm text-ink-muted">
                        {found.customer?.name ?? 'Cliente'} · {found.model?.name ?? ''}{' '}
                        {found.year ?? ''}
                      </div>
                    </div>
                    <Search size={18} className="shrink-0 text-ink-soft" />
                  </button>
                ))}

                {!search.isLoading && (search.data?.items.length ?? 0) === 0 ? (
                  <p className="px-1 text-sm text-ink-muted">
                    Nenhum veículo com essa placa.
                  </p>
                ) : null}
              </div>
            ) : null}

            {!creatingVehicle ? (
              <Button
                type="button"
                variant="secondary"
                className="h-12 w-full text-base"
                onClick={() => {
                  setCreatingVehicle(true);
                  setNewPlate(plate);
                }}
              >
                <Plus size={18} /> Cadastrar {plate ? `a placa ${plate}` : 'veículo novo'}
              </Button>
            ) : (
              <div className="space-y-3 rounded-2xl border border-surface-line bg-surface p-4">
                <Field label="Nome do cliente">
                  <Input
                    value={customerForm.name}
                    onChange={(event) =>
                      setCustomerForm((previous) => ({ ...previous, name: event.target.value }))
                    }
                    placeholder="Ex.: João da Silva"
                    autoFocus
                  />
                </Field>
                <Field label="Telefone (WhatsApp)">
                  <Input
                    value={customerForm.phone}
                    inputMode="tel"
                    onChange={(event) =>
                      setCustomerForm((previous) => ({ ...previous, phone: event.target.value }))
                    }
                    placeholder="(11) 99999-9999"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Placa">
                    <Input
                      value={newPlate}
                      onChange={(event) => setNewPlate(event.target.value.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={8}
                      className="font-mono uppercase"
                    />
                  </Field>
                  <Field label="Ano">
                    <Input
                      value={year}
                      inputMode="numeric"
                      maxLength={4}
                      onChange={(event) => setYear(event.target.value.replace(/\D/g, ''))}
                      placeholder="2018"
                    />
                  </Field>
                </div>

                <VehicleCatalogFields
                  brandId={brandId}
                  modelId={modelId}
                  onChange={({ brandId: nextBrand, modelId: nextModel }) => {
                    setBrandId(nextBrand);
                    setModelId(nextModel);
                  }}
                />

                <button
                  type="button"
                  onClick={() => setCreatingVehicle(false)}
                  className="text-sm font-medium text-ink-muted underline-offset-2 hover:underline"
                >
                  Cancelar cadastro
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          2. Serviços
        </h2>
        <Input
          value={serviceSearch}
          onChange={(event) => setServiceSearch(event.target.value)}
          placeholder="Buscar serviço (ex.: troca de óleo)"
          className="h-12 text-base"
        />

        <div className="space-y-2">
          {serviceItems.map((service) => {
            const active = Boolean(selected[service.id]);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service)}
                className={
                  active
                    ? 'flex w-full items-center justify-between gap-3 rounded-xl border border-brand bg-brand-soft p-3 text-left'
                    : 'flex w-full items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface p-3 text-left transition active:scale-[0.99]'
                }
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{service.name}</div>
                  <div className="text-sm tabular-nums text-ink-muted">
                    {formatMoney(service.basePrice)}
                  </div>
                </div>
                <span
                  className={
                    active
                      ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white'
                      : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-surface-line text-ink-muted'
                  }
                >
                  {active ? <Check size={16} /> : <Plus size={16} />}
                </span>
              </button>
            );
          })}
          {services.isLoading ? <Spinner /> : null}
          {!services.isLoading && serviceItems.length === 0 ? (
            <p className="px-1 text-sm text-ink-muted">
              Nenhum serviço encontrado. Cadastre o catálogo no computador.
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          3. O que o cliente pediu
        </h2>
        <Input
          value={complaint}
          onChange={(event) => setComplaint(event.target.value)}
          placeholder="Ex.: barulho na suspensão ao passar em buraco"
          className="h-12 text-base"
        />
      </section>

      <div className="sticky bottom-24 space-y-2 rounded-2xl border border-surface-line bg-surface/95 p-4 shadow-pop backdrop-blur">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-muted">
            {chosen.length} {chosen.length === 1 ? 'serviço' : 'serviços'}
          </span>
          <span className="text-xl font-semibold tabular-nums text-ink">
            {formatMoney(total)}
          </span>
        </div>
        <Button
          className="h-12 w-full text-base"
          disabled={!canSubmit}
          onClick={() => save.mutate()}
        >
          {save.isPending ? 'Abrindo…' : 'Abrir OS'}
        </Button>
      </div>
    </div>
  );
}
