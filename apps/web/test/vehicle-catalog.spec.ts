import { describe, expect, it } from 'vitest';
import { createTestTenant } from './helpers';
import {
  createBrand,
  createModel,
  listBrands,
  listModels,
} from '../src/server/services/vehicle-catalog.service';

describe('catálogo de veículos', () => {
  it('nasce com as marcas e modelos padrão', async () => {
    const t = await createTestTenant();

    const brands = await t.run(() => listBrands());
    expect(brands.length).toBeGreaterThanOrEqual(20);

    const fiat = brands.find((brand) => brand.name === 'Fiat');
    expect(fiat).toBeDefined();
    expect(fiat?._count.models).toBeGreaterThan(5);

    const models = await t.run(() => listModels(fiat!.id));
    expect(models.map((model) => model.name)).toContain('Uno');
  });

  it('cria marca e modelo e reaproveita sem diferenciar maiúsculas', async () => {
    const t = await createTestTenant();

    const brand = await t.run(() => createBrand('Marca Teste'));
    expect(brand.name).toBe('Marca Teste');

    const repeated = await t.run(() => createBrand('marca teste'));
    expect(repeated.id).toBe(brand.id);

    const model = await t.run(() => createModel(brand.id, 'Modelo X'));
    expect(model.brandId).toBe(brand.id);

    const repeatedModel = await t.run(() => createModel(brand.id, 'modelo x'));
    expect(repeatedModel.id).toBe(model.id);
  });

  it('isola o catálogo por oficina', async () => {
    const a = await createTestTenant();
    const b = await createTestTenant();

    await a.run(() => createBrand('Só da Oficina A'));

    const brandsB = await b.run(() => listBrands());
    expect(brandsB.some((brand) => brand.name === 'Só da Oficina A')).toBe(false);
  });
});
