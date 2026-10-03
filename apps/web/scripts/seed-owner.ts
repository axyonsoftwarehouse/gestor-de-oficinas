import { auth } from '../src/server/auth/auth';
import { system } from '../src/server/db/prisma';

async function main(): Promise<void> {
  const email = process.env.SEED_OWNER_EMAIL ?? 'owner@oficina.local';
  const password = process.env.SEED_OWNER_PASSWORD ?? 'password';
  const name = 'Proprietário Demo';

  const existing = await system.user.findUnique({ where: { email } });
  let userId: string;
  if (existing) {
    userId = existing.id;
    console.log(`Owner já existe: ${email}`);
  } else {
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });
    userId = result.user.id;
  }

  const tenant = await system.tenant.findUnique({ where: { slug: 'oficina-demo' } });
  if (!tenant) {
    throw new Error('Tenant "oficina-demo" não encontrado. Rode "pnpm db:seed" antes.');
  }

  const branch = await system.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.current_tenant', ${tenant.id}, true)`;
    return tx.branch.findFirst({
      where: { tenantId: tenant.id, code: 'MATRIZ' },
      select: { id: true },
    });
  });

  const membership = await system.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId } },
    update: { isOwner: true, status: 'ACTIVE' },
    create: {
      tenantId: tenant.id,
      userId,
      branchId: branch?.id,
      isOwner: true,
      status: 'ACTIVE',
    },
  });

  const ownerRole = await system.role.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'owner' } },
    select: { id: true },
  });
  if (ownerRole) {
    await system.membershipRole.upsert({
      where: {
        membershipId_roleId: { membershipId: membership.id, roleId: ownerRole.id },
      },
      update: {},
      create: { membershipId: membership.id, roleId: ownerRole.id },
    });
  }

  await system.user.update({
    where: { id: userId },
    data: { defaultTenantId: tenant.id },
  });

  console.log(`Owner pronto: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await system.$disconnect();
  });
