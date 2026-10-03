import { PrismaClient } from '@prisma/client';
import { seedMockData } from './seed/mock';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'oficina-demo' } });
  if (!tenant) {
    throw new Error('Tenant "oficina-demo" não encontrado. Rode o seed base antes (pnpm db:seed).');
  }

  const summary = await seedMockData(prisma, tenant.id);
  console.log('Mocks gerados para oficina-demo:');
  console.table(summary);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
