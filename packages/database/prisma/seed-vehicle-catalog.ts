import { PrismaClient } from '@prisma/client';
import { applyVehicleCatalog } from '../src/vehicle-catalog';

/**
 * Aplica o catálogo padrão de marcas/modelos em todas as oficinas.
 * Idempotente — pode rodar mais de uma vez sem duplicar.
 *
 *   pnpm db:seed:vehicle-catalog
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  if (tenants.length === 0) {
    console.log('Nenhuma oficina encontrada — nada a fazer.');
    return;
  }

  for (const tenant of tenants) {
    await applyVehicleCatalog(prisma, tenant.id);
    console.log(`Catálogo aplicado: ${tenant.name} (${tenant.slug})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
