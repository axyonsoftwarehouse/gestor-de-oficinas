import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedPermissions, seedTenantRoles } from './seed/permissions';

const prisma = new PrismaClient();

async function seedInspectionTemplate(
  tenantId: string,
): Promise<void> {
  const existing = await prisma.inspectionTemplate.findFirst({
    where: { tenantId, name: 'Inspeção Básica' },
  });
  if (existing) return;

  await prisma.inspectionTemplate.create({
    data: {
      tenantId,
      name: 'Inspeção Básica',
      description: 'Checklist padrão de entrada do veículo.',
      versions: {
        create: {
          version: 1,
          publishedAt: new Date(),
          sections: {
            create: [
              {
                title: 'Freios e Pneus',
                sequence: 1,
                questions: {
                  create: [
                    {
                      code: 'FR_PASTILHA',
                      label: 'Pastilhas de freio',
                      type: 'SELECT',
                      required: true,
                      sequence: 1,
                      options: {
                        create: [
                          { label: 'OK', value: 'ok', sequence: 1 },
                          { label: 'Atenção', value: 'attention', sequence: 2 },
                          { label: 'Trocar', value: 'repair', sequence: 3 },
                        ],
                      },
                    },
                    {
                      code: 'PN_PRESSAO',
                      label: 'Pressão dos pneus (psi)',
                      type: 'NUMBER',
                      sequence: 2,
                    },
                  ],
                },
              },
              {
                title: 'Observações',
                displayType: 'NOTE',
                sequence: 2,
                questions: {
                  create: [
                    {
                      code: 'OBS_GERAL',
                      label: 'Observações gerais',
                      type: 'TEXTAREA',
                      sequence: 1,
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  });
}

async function seedDemoTenant(): Promise<void> {
  if (process.env.SEED_DEMO_TENANT === 'false') {
    console.log('SEED_DEMO_TENANT=false — pulando tenant de demonstração.');
    return;
  }

  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'owner@oficina.local';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? 'password';
  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'oficina-demo' },
    update: {},
    create: {
      name: 'Oficina Demo',
      slug: 'oficina-demo',
      status: 'ACTIVE',
      plan: 'trial',
    },
  });

  const branch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'MATRIZ' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Matriz', code: 'MATRIZ' },
  });

  await seedTenantRoles(prisma, tenant.id);

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { name: 'Proprietário Demo' },
    create: {
      email: ownerEmail,
      name: 'Proprietário Demo',
      passwordHash,
      isActive: true,
    },
  });

  const membership = await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
    update: { isOwner: true, status: 'ACTIVE' },
    create: {
      tenantId: tenant.id,
      userId: owner.id,
      branchId: branch.id,
      isOwner: true,
      status: 'ACTIVE',
    },
  });

  const ownerRole = await prisma.role.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'owner' } },
  });

  if (ownerRole) {
    await prisma.membershipRole.upsert({
      where: {
        membershipId_roleId: { membershipId: membership.id, roleId: ownerRole.id },
      },
      update: {},
      create: { membershipId: membership.id, roleId: ownerRole.id },
    });
  }

  const paymentMethods = [
    ['Dinheiro', 'CASH'],
    ['Cartão', 'CARD'],
    ['Pix', 'PIX'],
    ['Transferência', 'TRANSFER'],
  ] as const;
  for (const [name, type] of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      update: {},
      create: { tenantId: tenant.id, name, type },
    });
  }

  const units = [
    ['Unidade', 'un'],
    ['Hora', 'h'],
    ['Litro', 'L'],
  ] as const;
  for (const [name, abbreviation] of units) {
    await prisma.unit.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      update: {},
      create: { tenantId: tenant.id, name, abbreviation },
    });
  }

  await prisma.tax.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Sem imposto' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Sem imposto', rate: 0, type: 'PERCENT' },
  });

  await seedInspectionTemplate(tenant.id);

  console.log(
    `Tenant demo pronto: ${tenant.slug} (owner: ${ownerEmail} / ${ownerPassword})`,
  );
}

async function main(): Promise<void> {
  const total = await seedPermissions(prisma);
  console.log(`Permissões sincronizadas: ${total}`);
  await seedDemoTenant();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
