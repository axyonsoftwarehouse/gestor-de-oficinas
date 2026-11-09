import type { Prisma } from '@prisma/client';
import { VEHICLE_CATALOG } from '@gestor/shared';

/**
 * Cliente mínimo aceito: `PrismaClient` ou `Prisma.TransactionClient`.
 * (O tipo estrutural evita a incompatibilidade de união entre os dois.)
 */
interface CatalogClient {
  vehicleBrand: {
    createMany(args: Prisma.VehicleBrandCreateManyArgs): Promise<Prisma.BatchPayload>;
    findMany(args: Prisma.VehicleBrandFindManyArgs): Promise<{ id: string; name: string }[]>;
  };
  vehicleModel: {
    createMany(args: Prisma.VehicleModelCreateManyArgs): Promise<Prisma.BatchPayload>;
  };
}

/**
 * Garante o catálogo padrão de marcas/modelos para um tenant.
 * Idempotente: usa `skipDuplicates` nas duas tabelas.
 */
export async function applyVehicleCatalog(
  client: CatalogClient,
  tenantId: string,
): Promise<void> {
  await client.vehicleBrand.createMany({
    data: VEHICLE_CATALOG.map((entry) => ({ tenantId, name: entry.brand })),
    skipDuplicates: true,
  });

  const brands = await client.vehicleBrand.findMany({
    where: { tenantId, name: { in: VEHICLE_CATALOG.map((entry) => entry.brand) } },
    select: { id: true, name: true },
  });
  const brandIdByName = new Map(brands.map((brand) => [brand.name, brand.id]));

  const models = VEHICLE_CATALOG.flatMap((entry) => {
    const brandId = brandIdByName.get(entry.brand);
    return brandId
      ? entry.models.map((name) => ({ tenantId, brandId, name }))
      : [];
  });

  if (models.length > 0) {
    await client.vehicleModel.createMany({ data: models, skipDuplicates: true });
  }
}
