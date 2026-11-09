'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useVehicleBrands, useVehicleModels } from '@/lib/queries';
import { Button, Field, Input, Select } from '@/components/ui';

const NEW = '__new__';

export interface VehicleCatalogSelection {
  brandId: string;
  modelId: string;
}

/**
 * Marca e modelo em dois selects encadeados, com criação na hora.
 * Usado no cadastro de veículo do back-office e no app da oficina.
 */
export function VehicleCatalogFields({
  brandId,
  modelId,
  onChange,
}: {
  brandId: string;
  modelId: string;
  onChange: (next: VehicleCatalogSelection) => void;
}): JSX.Element {
  const qc = useQueryClient();
  const brands = useVehicleBrands();
  const models = useVehicleModels(brandId && brandId !== NEW ? brandId : undefined);
  const [adding, setAdding] = useState<'brand' | 'model' | null>(null);
  const [name, setName] = useState('');

  const addBrand = useMutation({
    mutationFn: (value: string) =>
      apiFetch<{ id: string; name: string }>('/vehicle-catalog/brands', {
        method: 'POST',
        body: JSON.stringify({ name: value }),
      }),
    onSuccess: (brand) => {
      void qc.invalidateQueries({ queryKey: ['vehicle-catalog', 'brands'] });
      onChange({ brandId: brand.id, modelId: '' });
      setName('');
      setAdding(null);
      toast.success('Marca adicionada');
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar a marca'),
  });

  const addModel = useMutation({
    mutationFn: (value: string) =>
      apiFetch<{ id: string; name: string }>('/vehicle-catalog/models', {
        method: 'POST',
        body: JSON.stringify({ brandId, name: value }),
      }),
    onSuccess: (model) => {
      void qc.invalidateQueries({
        queryKey: ['vehicle-catalog', 'models', brandId],
      });
      onChange({ brandId, modelId: model.id });
      setName('');
      setAdding(null);
      toast.success('Modelo adicionado');
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar o modelo'),
  });

  const addingPending = addBrand.isPending || addModel.isPending;

  function submitNew(): void {
    const value = name.trim();
    if (!value) return;
    if (adding === 'brand') addBrand.mutate(value);
    if (adding === 'model') addModel.mutate(value);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Marca">
          <Select
            value={adding === 'brand' ? NEW : brandId}
            onChange={(event) => {
              const value = event.target.value;
              if (value === NEW) {
                setName('');
                setAdding('brand');
                return;
              }
              setAdding(null);
              onChange({ brandId: value, modelId: '' });
            }}
          >
            <option value="">Selecione…</option>
            {brands.data?.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
            <option value={NEW}>+ Nova marca…</option>
          </Select>
        </Field>

        <Field label="Modelo">
          <Select
            disabled={!brandId || brandId === NEW || adding === 'model'}
            value={adding === 'model' ? NEW : modelId}
            onChange={(event) => {
              const value = event.target.value;
              if (value === NEW) {
                setName('');
                setAdding('model');
                return;
              }
              setAdding(null);
              onChange({ brandId, modelId: value });
            }}
          >
            <option value="">
              {brandId && brandId !== NEW ? 'Selecione…' : 'Escolha a marca primeiro'}
            </option>
            {models.data?.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
            {brandId && brandId !== NEW ? <option value={NEW}>+ Novo modelo…</option> : null}
          </Select>
        </Field>
      </div>

      {adding ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-surface-line bg-surface-soft p-3">
          <div className="min-w-[160px] flex-1">
            <Field label={adding === 'brand' ? 'Nome da marca' : 'Nome do modelo'}>
              <Input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={adding === 'brand' ? 'Ex.: Jac' : 'Ex.: iEV40'}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitNew();
                  }
                }}
              />
            </Field>
          </div>
          <Button
            type="button"
            disabled={!name.trim() || addingPending}
            onClick={submitNew}
          >
            {addingPending ? 'Adicionando…' : 'Adicionar'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAdding(null);
              setName('');
            }}
          >
            Cancelar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
