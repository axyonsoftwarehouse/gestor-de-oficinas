import { PrismaClient } from '@prisma/client';

/**
 * Verifica que o RLS está ativo de fato. Requer que o DATABASE_URL do teste
 * aponte para o papel de aplicação (não-superusuário), por exemplo:
 *   DATABASE_URL="postgresql://app_gestor:app_gestor@localhost:5433/gestor?schema=public"
 */
describe('RLS multi-tenant (e2e)', () => {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL,
  });

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('sem tenant definido, nenhuma linha é visível', async () => {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) AS count FROM customers
    `;
    expect(Number(rows[0]!.count)).toBe(0);
  });

  it('com app.current_tenant definido, as linhas do tenant aparecem', async () => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'oficina-demo' } });
    expect(tenant).not.toBeNull();

    const count = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`select set_config('app.current_tenant', ${tenant!.id}, true)`;
      const rows = await tx.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) AS count FROM customers
      `;
      return Number(rows[0]!.count);
    });

    expect(count).toBeGreaterThan(0);
  });
});
