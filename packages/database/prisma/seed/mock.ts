import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

/** PRNG determinístico (mulberry32) para gerar mocks reproduzíveis. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MockSummary {
  branches: number;
  customers: number;
  vehicles: number;
  parts: number;
  services: number;
  jobCards: number;
  inspections: number;
  quotations: number;
  invoices: number;
  payments: number;
  purchases: number;
  expenses: number;
  appointments: number;
}

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique',
  'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nathan', 'Olívia', 'Paulo',
  'Queila', 'Rafael', 'Sofia', 'Thiago', 'Ursula', 'Vinícius', 'Wesley', 'Yasmin',
  'Zélia', 'Camila', 'Diego', 'Fernanda', 'Gustavo', 'Helena', 'Igor', 'Juliana',
  'Leandro', 'Michele', 'Otávio', 'Priscila', 'Renan', 'Talita', 'Vitor', 'Wagner',
];
const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira',
  'Almeida', 'Rodrigues', 'Gomes', 'Martins', 'Araújo', 'Barbosa', 'Ribeiro', 'Carvalho',
];
const CITIES = [
  ['São Paulo', 'SP'], ['Campinas', 'SP'], ['Santo André', 'SP'], ['Osasco', 'SP'],
  ['Guarulhos', 'SP'], ['São Bernardo', 'SP'], ['Sorocaba', 'SP'], ['Santos', 'SP'],
];
const MODELS: Record<string, string[]> = {
  Fiat: ['Argo', 'Cronos', 'Strada', 'Pulse', 'Toro'],
  Volkswagen: ['Gol', 'Polo', 'T-Cross', 'Nivus', 'Saveiro'],
  Chevrolet: ['Onix', 'Tracker', 'Montana', 'Cruze', 'Spin'],
  Toyota: ['Corolla', 'Corolla Cross', 'Yaris', 'Hilux', 'Etios'],
  Honda: ['Civic', 'City', 'HR-V', 'Fit', 'WR-V'],
  Ford: ['Ka', 'EcoSport', 'Ranger', 'Territory', 'Bronco'],
  Hyundai: ['HB20', 'Creta', 'Tucson', 'i30', 'Venue'],
  Renault: ['Kwid', 'Sandero', 'Duster', 'Logan', 'Captur'],
  Jeep: ['Renegade', 'Compass', 'Commander'],
  Nissan: ['Kicks', 'Versa', 'Frontier'],
};
const PART_SEEDS: [string, string, number, number][] = [
  ['Óleo motor 5W30', 'OLEO-5W30', 28, 55],
  ['Filtro de óleo', 'FILT-OLEO', 18, 40],
  ['Filtro de ar', 'FILT-AR', 25, 60],
  ['Filtro de combustível', 'FILT-COMB', 30, 70],
  ['Pastilha de freio dianteira', 'PAST-DIANT', 90, 190],
  ['Disco de freio', 'DISCO-FREIO', 150, 320],
  ['Correia dentada', 'CORR-DENT', 120, 260],
  ['Vela de ignição', 'VELA', 22, 48],
  ['Bateria 60Ah', 'BAT-60', 320, 520],
  ['Amortecedor dianteiro', 'AMORT-DIANT', 180, 380],
  ['Pneu 185/65 R15', 'PNEU-185', 280, 460],
  ['Lâmpada H4', 'LAMP-H4', 12, 30],
  ['Palheta limpador', 'PALHETA', 25, 55],
  ['Fluido de freio DOT4', 'FLU-FREIO', 20, 45],
  ['Aditivo radiador', 'ADIT-RAD', 24, 50],
  ['Bomba d’água', 'BOMBA-AGUA', 160, 340],
];
const SERVICE_SEEDS: [string, number, number][] = [
  ['Troca de óleo e filtro', 120, 30],
  ['Alinhamento e balanceamento', 150, 45],
  ['Revisão completa', 380, 120],
  ['Troca de pastilhas de freio', 180, 60],
  ['Diagnóstico eletrônico', 130, 30],
  ['Higienização de ar-condicionado', 160, 50],
  ['Troca de correia dentada', 420, 180],
  ['Troca de amortecedores', 500, 240],
  ['Troca de bateria', 60, 15],
  ['Reparo de suspensão', 350, 150],
];
const EXPENSE_CATEGORIES = ['Aluguel', 'Energia', 'Água', 'Material de limpeza', 'Ferramentas', 'Marketing', 'Salários', 'Internet'];

function line(qty: number, price: number, discountPct = 0, taxRate = 0) {
  const gross = new Prisma.Decimal(qty).mul(price);
  const discount = gross.mul(discountPct).div(100);
  const base = gross.minus(discount);
  const taxAmount = base.mul(taxRate).div(100);
  return {
    quantity: new Prisma.Decimal(qty),
    unitPrice: new Prisma.Decimal(Number(price.toFixed(2))),
    discountValue: new Prisma.Decimal(Number(discount.toFixed(2))),
    taxBase: new Prisma.Decimal(Number(base.toFixed(2))),
    taxAmount: new Prisma.Decimal(Number(taxAmount.toFixed(2))),
    total: new Prisma.Decimal(Number(base.plus(taxAmount).toFixed(2))),
  };
}

export async function seedMockData(
  prisma: PrismaClient,
  tenantId: string,
  options: { seed?: number } = {},
): Promise<MockSummary> {
  const rand = mulberry32(options.seed ?? 20240925);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
  const int = (min: number, max: number): number => Math.floor(rand() * (max - min + 1)) + min;
  const chance = (p: number): boolean => rand() < p;
  const pad = (n: number): string => String(n).padStart(6, '0');
  const daysAgo = (n: number): Date => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  // ---------------- Limpeza (escopo do tenant) ----------------
  await prisma.invoice.deleteMany({ where: { tenantId } });
  await prisma.quotation.deleteMany({ where: { tenantId } });
  await prisma.inspection.deleteMany({ where: { tenantId } });
  await prisma.jobCard.deleteMany({ where: { tenantId } });
  await prisma.appointment.deleteMany({ where: { tenantId } });
  await prisma.purchase.deleteMany({ where: { tenantId } });
  await prisma.stockMovement.deleteMany({ where: { tenantId } });
  await prisma.stockBalance.deleteMany({ where: { tenantId } });
  await prisma.expense.deleteMany({ where: { tenantId } });
  await prisma.vehicleHistory.deleteMany({ where: { tenantId } });
  await prisma.vehicle.deleteMany({ where: { tenantId } });
  await prisma.customer.deleteMany({ where: { tenantId } });
  await prisma.servicePart.deleteMany({ where: { tenantId } });
  await prisma.partCatalog.deleteMany({ where: { tenantId } });
  await prisma.serviceCatalog.deleteMany({ where: { tenantId } });
  await prisma.supplier.deleteMany({ where: { tenantId } });
  await prisma.stockLocation.deleteMany({ where: { tenantId } });
  await prisma.inspectionTemplate.deleteMany({ where: { tenantId } });
  await prisma.note.deleteMany({ where: { tenantId } });
  await prisma.numberSequence.deleteMany({ where: { tenantId } });
  await prisma.membership.deleteMany({ where: { tenantId, isOwner: false } });

  // ---------------- Filiais ----------------
  const branchA = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId, code: 'MATRIZ' } },
    update: { name: 'Matriz' },
    create: { tenantId, name: 'Matriz', code: 'MATRIZ' },
  });
  const branchB = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId, code: 'FILIAL' } },
    update: { name: 'Filial Zona Sul' },
    create: { tenantId, name: 'Filial Zona Sul', code: 'FILIAL' },
  });
  const branches = [branchA, branchB];

  // ---------------- Catálogos de veículo ----------------
  const brandNames = Object.keys(MODELS);
  const brands: { id: string; name: string }[] = [];
  const models: { id: string; brandId: string; name: string }[] = [];
  for (const name of brandNames) {
    const brand = await prisma.vehicleBrand.upsert({
      where: { tenantId_name: { tenantId, name } },
      update: {},
      create: { tenantId, name },
    });
    brands.push(brand);
    for (const modelName of MODELS[name]!) {
      const model = await prisma.vehicleModel.upsert({
        where: { brandId_name: { brandId: brand.id, name: modelName } },
        update: {},
        create: { tenantId, brandId: brand.id, name: modelName },
      });
      models.push({ id: model.id, brandId: brand.id, name: model.name });
    }
  }
  const vehicleTypes = await Promise.all(
    ['Hatch', 'Sedan', 'SUV', 'Picape', 'Moto'].map((name) =>
      prisma.vehicleType.upsert({ where: { tenantId_name: { tenantId, name } }, update: {}, create: { tenantId, name } }),
    ),
  );
  const colors = await Promise.all(
    ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul'].map((name) =>
      prisma.vehicleColor.upsert({ where: { tenantId_name: { tenantId, name } }, update: {}, create: { tenantId, name } }),
    ),
  );
  const fuels = await Promise.all(
    ['Gasolina', 'Etanol', 'Flex', 'Diesel', 'GNV', 'Elétrico'].map((name) =>
      prisma.vehicleFuelType.upsert({ where: { tenantId_name: { tenantId, name } }, update: {}, create: { tenantId, name } }),
    ),
  );

  // ---------------- Equipe / usuários ----------------
  const roleBySlug = new Map(
    (await prisma.role.findMany({ where: { tenantId } })).map((role) => [role.slug, role.id]),
  );
  const staffSeed: [string, string, string][] = [
    ['Carlos Mecânico', 'mecanico@oficina.local', 'mechanic'],
    ['Marcos Mecânico', 'mecanico2@oficina.local', 'mechanic'],
    ['Juliana Atendente', 'atendente@oficina.local', 'advisor'],
    ['Roberto Gerente', 'gerente@oficina.local', 'manager'],
    ['Patrícia Financeiro', 'financeiro@oficina.local', 'accountant'],
  ];
  const staff: { id: string; userId: string; name: string; role: string }[] = [];
  for (let i = 0; i < staffSeed.length; i++) {
    const [name, email] = staffSeed[i]!;
    const roleSlug = staffSeed[i]![2];
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name, isActive: true },
    });
    const membership = await prisma.membership.upsert({
      where: { tenantId_userId: { tenantId, userId: user.id } },
      update: { branchId: branches[i % branches.length]!.id },
      create: { tenantId, userId: user.id, branchId: branches[i % branches.length]!.id },
    });
    const roleId = roleBySlug.get(roleSlug);
    if (roleId) {
      await prisma.membershipRole.upsert({
        where: { membershipId_roleId: { membershipId: membership.id, roleId } },
        update: {},
        create: { membershipId: membership.id, roleId },
      });
    }
    staff.push({ id: membership.id, userId: user.id, name, role: roleSlug });
  }
  const mechanics = staff.filter((s) => s.role === 'mechanic');

  // ---------------- Clientes e veículos ----------------
  const customers: { id: string; name: string }[] = [];
  const customerCount = 45;
  for (let i = 0; i < customerCount; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const [city, state] = pick(CITIES);
    const isCompany = chance(0.15);
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        type: isCompany ? 'COMPANY' : 'INDIVIDUAL',
        name: isCompany ? `${name} Comércio LTDA` : name,
        document: isCompany ? `12.345.${int(100, 999)}/0001-${int(10, 99)}` : `${int(100, 999)}.${int(100, 999)}.${int(100, 999)}-${int(10, 99)}`,
        email: `cliente${i + 1}@exemplo.com`,
        phone: `(11) 9${int(1000, 9999)}-${int(1000, 9999)}`,
        city,
        state,
        zip: `${int(10000, 19999)}-${int(100, 999)}`,
      },
    });
    customers.push({ id: customer.id, name: customer.name });
  }

  const vehicles: { id: string; customerId: string; plate: string }[] = [];
  const plateLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const customer of customers) {
    const count = int(1, 2);
    for (let v = 0; v < count; v++) {
      const brand = pick(brands);
      const model = pick(models.filter((m) => m.brandId === brand.id));
      const plate = `${pick(plateLetters.split(''))}${pick(plateLetters.split(''))}${pick(plateLetters.split(''))}${int(0, 9)}${pick(plateLetters.split(''))}${int(10, 99)}`;
      const vehicle = await prisma.vehicle.create({
        data: {
          tenantId,
          customerId: customer.id,
          brandId: brand.id,
          modelId: model?.id,
          typeId: pick(vehicleTypes).id,
          colorId: pick(colors).id,
          fuelTypeId: pick(fuels).id,
          plate,
          vin: `9BW${randomUUID().replace(/-/g, '').slice(0, 14).toUpperCase()}`,
          year: int(2012, 2024),
          transmission: pick(['MANUAL', 'AUTOMATIC', 'CVT'] as const),
          odometer: new Prisma.Decimal(int(10000, 180000)),
          odometerUnit: 'KM',
        },
      });
      vehicles.push({ id: vehicle.id, customerId: customer.id, plate });
    }
  }

  // ---------------- Fornecedores, peças, serviços, impostos ----------------
  const suppliers = await Promise.all(
    ['Auto Peças Central', 'Distribuidora Norte', 'Peças & Cia', 'Importadora Sul'].map((name) =>
      prisma.supplier.create({
        data: { tenantId, name, email: `${name.split(' ')[0]!.toLowerCase()}@fornecedor.com` },
      }),
    ),
  );

  const unitUn = await prisma.unit.upsert({ where: { tenantId_name: { tenantId, name: 'Unidade' } }, update: {}, create: { tenantId, name: 'Unidade', abbreviation: 'un' } });
  const taxes = await Promise.all(
    [['Sem imposto', 0], ['ISS 5%', 5]].map(([name, rate]) =>
      prisma.tax.upsert({
        where: { tenantId_name: { tenantId, name: String(name) } },
        update: {},
        create: { tenantId, name: String(name), rate: new Prisma.Decimal(Number(rate)), type: 'PERCENT' },
      }),
    ),
  );
  const issTax = taxes.find((t) => t.name === 'ISS 5%')!;

  const parts: { id: string; name: string; salePrice: number; taxId: string }[] = [];
  for (const [name, sku, cost, sale] of PART_SEEDS) {
    const part = await prisma.partCatalog.create({
      data: {
        tenantId,
        name,
        sku,
        unitId: unitUn.id,
        costPrice: new Prisma.Decimal(cost),
        salePrice: new Prisma.Decimal(sale),
        minStock: new Prisma.Decimal(int(3, 10)),
      },
    });
    parts.push({ id: part.id, name: part.name, salePrice: sale, taxId: issTax.id });
  }

  const services: { id: string; name: string; price: number }[] = [];
  for (const [name, price, time] of SERVICE_SEEDS) {
    const service = await prisma.serviceCatalog.create({
      data: { tenantId, name, basePrice: new Prisma.Decimal(price), standardTime: new Prisma.Decimal(time) },
    });
    services.push({ id: service.id, name: service.name, price });
  }

  // ---------------- Estoque ----------------
  const locations = await Promise.all([
    prisma.stockLocation.create({ data: { tenantId, branchId: branchA.id, name: 'Almoxarifado Matriz' } }),
    prisma.stockLocation.create({ data: { tenantId, branchId: branchB.id, name: 'Almoxarifado Filial' } }),
  ]);
  const locA = locations[0]!;

  for (const part of parts) {
    const qty = int(5, 40);
    const cost = PART_SEEDS.find((p) => p[1] === part.name || p[0] === part.name)?.[2] ?? 50;
    await prisma.stockMovement.create({
      data: {
        tenantId,
        branchId: branchA.id,
        locationId: locA.id,
        partId: part.id,
        type: 'PURCHASE',
        quantity: new Prisma.Decimal(qty),
        unitCost: new Prisma.Decimal(cost),
        refType: 'mock_initial',
        notes: 'Carga inicial de estoque',
      },
    });
    await prisma.stockBalance.create({
      data: { tenantId, locationId: locA.id, partId: part.id, quantity: new Prisma.Decimal(qty) },
    });
  }

  // ---------------- Templates de inspeção ----------------
  const templateQuestions: { id: string }[] = [];
  const template = await prisma.inspectionTemplate.create({
    data: {
      tenantId,
      name: 'Inspeção de Entrada',
      description: 'Checklist de recebimento do veículo',
      versions: {
        create: {
          version: 1,
          publishedAt: daysAgo(60),
          sections: {
            create: [
              {
                title: 'Exterior',
                sequence: 1,
                questions: {
                  create: [
                    { code: 'EXT_LATARIA', label: 'Lataria (riscos/amassados)', type: 'SELECT', required: true, sequence: 1, options: { create: [{ label: 'OK', value: 'ok', sequence: 1 }, { label: 'Atenção', value: 'attention', sequence: 2 }, { label: 'Reparar', value: 'repair', sequence: 3 }] } },
                    { code: 'EXT_VIDROS', label: 'Vidros e retrovisores', type: 'SELECT', required: true, sequence: 2, options: { create: [{ label: 'OK', value: 'ok', sequence: 1 }, { label: 'Trincado', value: 'repair', sequence: 2 }] } },
                    { code: 'EXT_PNEUS', label: 'Estado dos pneus', type: 'SELECT', sequence: 3, options: { create: [{ label: 'OK', value: 'ok', sequence: 1 }, { label: 'Trocar', value: 'repair', sequence: 2 }] } },
                  ],
                },
              },
              {
                title: 'Freios e Fluidos',
                sequence: 2,
                questions: {
                  create: [
                    { code: 'FR_PASTILHA', label: 'Pastilhas de freio', type: 'SELECT', required: true, sequence: 1, options: { create: [{ label: 'OK', value: 'ok', sequence: 1 }, { label: 'Atenção', value: 'attention', sequence: 2 }, { label: 'Trocar', value: 'repair', sequence: 3 }] } },
                    { code: 'FL_OLEO', label: 'Nível de óleo', type: 'SELECT', sequence: 2, options: { create: [{ label: 'OK', value: 'ok', sequence: 1 }, { label: 'Completar', value: 'attention', sequence: 2 }] } },
                  ],
                },
              },
              {
                title: 'Observações',
                displayType: 'NOTE',
                sequence: 3,
                questions: { create: [{ code: 'OBS_GERAL', label: 'Observações gerais', type: 'TEXTAREA', sequence: 1 }] },
              },
            ],
          },
        },
      },
    },
    include: { versions: { include: { sections: { include: { questions: true } } } } },
  });
  const version = template.versions[0]!;
  for (const section of version.sections) {
    for (const question of section.questions) templateQuestions.push({ id: question.id });
  }

  // ---------------- Ordens de serviço + inspeções ----------------
  const jobStatuses = ['DRAFT', 'SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'DELIVERED', 'CANCELLED'] as const;
  const jobTypes = ['INSPECTION', 'REPAIR', 'SERVICE'] as const;
  const jobs: { id: string; number: string; customerId: string; vehicleId: string; status: string; total: Prisma.Decimal; branchId: string }[] = [];
  const jobCount = 38;
  let jobSeq = 0;
  for (let i = 0; i < jobCount; i++) {
    const vehicle = pick(vehicles);
    const branch = pick(branches);
    const status = pick(jobStatuses);
    const type = pick(jobTypes);
    jobSeq += 1;
    const number = `JC-${pad(jobSeq)}`;
    const created = daysAgo(int(1, 90));

    const job = await prisma.jobCard.create({
      data: {
        tenantId,
        branchId: branch.id,
        number,
        type,
        status,
        customerId: vehicle.customerId,
        vehicleId: vehicle.id,
        assignedToId: pick(mechanics).userId,
        odometerIn: new Prisma.Decimal(int(10000, 180000)),
        customerComplaint: pick(['Barulho na suspensão', 'Freio rangendo', 'Ar-condicionado fraco', 'Revisão preventiva', 'Luz de injeção acesa', 'Vibração ao frear']),
        createdAt: created,
        startedAt: status !== 'DRAFT' ? created : undefined,
        completedAt: ['COMPLETED', 'DELIVERED'].includes(status) ? daysAgo(int(0, 20)) : undefined,
        deliveredAt: status === 'DELIVERED' ? daysAgo(int(0, 10)) : undefined,
      },
    });

    // Linhas
    let subtotal = new Prisma.Decimal(0);
    let taxTotal = new Prisma.Decimal(0);
    const lineCount = int(1, 5);
    for (let l = 0; l < lineCount; l++) {
      const isPart = chance(0.55);
      const applyTax = chance(0.4);
      if (isPart) {
        const part = pick(parts);
        const qty = int(1, 3);
        const amounts = line(qty, part.salePrice, chance(0.2) ? int(5, 10) : 0, 0);
        await prisma.jobLine.create({
          data: { jobCardId: job.id, type: 'PART', partId: part.id, description: part.name, ...amounts, sequence: l },
        });
        subtotal = subtotal.plus(amounts.taxBase);
        taxTotal = taxTotal.plus(amounts.taxAmount);
      } else {
        const service = pick(services);
        const amounts = line(1, service.price, 0, applyTax ? 5 : 0);
        const created2 = await prisma.jobLine.create({
          data: { jobCardId: job.id, type: 'LABOR', serviceId: service.id, description: service.name, ...amounts, sequence: l },
        });
        if (applyTax) {
          await prisma.jobLineTax.create({ data: { lineId: created2.id, taxId: issTax.id, rate: new Prisma.Decimal(5), base: amounts.taxBase, amount: amounts.taxAmount } });
        }
        subtotal = subtotal.plus(amounts.taxBase);
        taxTotal = taxTotal.plus(amounts.taxAmount);
      }
    }
    const total = subtotal.plus(taxTotal);

    await prisma.jobCard.update({ where: { id: job.id }, data: { subtotal, taxTotal, total } });
    await prisma.jobStatusHistory.create({ data: { jobCardId: job.id, toStatus: status, changedById: pick(mechanics).userId, changedAt: created } });
    if (chance(0.5)) {
      await prisma.jobMechanic.create({ data: { jobCardId: job.id, userId: pick(mechanics).userId, role: 'Técnico', hours: new Prisma.Decimal(int(1, 8)) } });
    }
    jobs.push({ id: job.id, number, customerId: vehicle.customerId, vehicleId: vehicle.id, status, total, branchId: branch.id });
  }

  // ---------------- Inspeções (execuções) ----------------
  let inspectionCount = 0;
  for (const vehicle of vehicles.slice(0, 12)) {
    await prisma.inspection.create({
      data: {
        tenantId,
        branchId: pick(branches).id,
        vehicleId: vehicle.id,
        templateVersionId: version.id,
        inspectorId: pick(mechanics).userId,
        status: chance(0.6) ? 'COMPLETED' : 'IN_PROGRESS',
        startedAt: daysAgo(int(1, 40)),
        completedAt: chance(0.6) ? daysAgo(int(0, 30)) : undefined,
        answers: {
          create: templateQuestions.map((q) => ({
            questionId: q.id,
            value: pick(['ok', 'attention', 'repair']),
            result: pick(['OK', 'ATTENTION', 'REPAIR'] as const),
          })),
        },
      },
    });
    inspectionCount += 1;
  }

  // ---------------- Orçamentos + faturas + pagamentos ----------------
  let quotationSeq = 0;
  let invoiceSeq = 0;
  let quotationCount = 0;
  let invoiceCount = 0;
  let paymentCount = 0;
  const paymentMethods = await prisma.paymentMethod.findMany({ where: { tenantId } });

  const jobsForQuotes = jobs.filter((j) => !['CANCELLED'].includes(j.status)).slice(0, 14);
  for (const job of jobsForQuotes) {
    quotationSeq += 1;
    const qStatus = pick(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'CONVERTED'] as const);
    const qLines = await prisma.jobLine.findMany({ where: { jobCardId: job.id } });
    let qSubtotal = new Prisma.Decimal(0);
    let qTax = new Prisma.Decimal(0);
    const created = daysAgo(int(5, 60));
    const quotation = await prisma.quotation.create({
      data: { tenantId, branchId: job.branchId, jobCardId: job.id, customerId: job.customerId, number: `OR-${pad(quotationSeq)}`, status: qStatus, createdAt: created, validUntil: daysAgo(-15) },
    });
    for (let i = 0; i < qLines.length; i++) {
      const source = qLines[i]!;
      const amounts = line(Number(source.quantity), Number(source.unitPrice), Number(source.discountValue) > 0 && Number(source.unitPrice) > 0 ? 5 : 0, 0);
      await prisma.quotationLine.create({
        data: { quotationId: quotation.id, type: source.type, serviceId: source.serviceId ?? undefined, partId: source.partId ?? undefined, description: source.description ?? undefined, ...amounts, sequence: i },
      });
      qSubtotal = qSubtotal.plus(amounts.taxBase);
      qTax = qTax.plus(amounts.taxAmount);
    }
    await prisma.quotation.update({ where: { id: quotation.id }, data: { subtotal: qSubtotal, taxTotal: qTax, total: qSubtotal.plus(qTax) } });
    quotationCount += 1;

    if (qStatus === 'APPROVED' || qStatus === 'CONVERTED') {
      invoiceSeq += 1;
      const invoice = await prisma.invoice.create({
        data: {
          tenantId,
          branchId: job.branchId,
          jobCardId: job.id,
          quotationId: quotation.id,
          customerId: job.customerId,
          number: `FT-${pad(invoiceSeq)}`,
          status: 'ISSUED',
          issueDate: daysAgo(int(1, 40)),
          subtotal: qSubtotal,
          taxTotal: qTax,
          total: qSubtotal.plus(qTax),
        },
      });
      await prisma.quotation.update({ where: { id: quotation.id }, data: { status: 'CONVERTED' } });
      const iLines = await prisma.quotationLine.findMany({ where: { quotationId: quotation.id } });
      for (let i = 0; i < iLines.length; i++) {
        const source = iLines[i]!;
        await prisma.invoiceLine.create({
          data: { invoiceId: invoice.id, type: source.type, serviceId: source.serviceId ?? undefined, partId: source.partId ?? undefined, description: source.description ?? undefined, quantity: source.quantity, unitPrice: source.unitPrice, discountType: source.discountType ?? undefined, discountValue: source.discountValue, taxBase: source.taxBase, taxAmount: source.taxAmount, total: source.total, quotationLineId: source.id, sequence: i },
        });
      }
      invoiceCount += 1;

      const total = qSubtotal.plus(qTax);
      const payMode = pick(['none', 'partial', 'full']);
      let paid = new Prisma.Decimal(0);
      if (payMode !== 'none') {
        const amount = payMode === 'full' ? total : new Prisma.Decimal(Number(total.mul(0.4).toFixed(2)));
        await prisma.payment.create({
          data: { tenantId, invoiceId: invoice.id, amount, methodId: paymentMethods.length ? pick(paymentMethods).id : undefined, paidAt: daysAgo(int(0, 20)), reference: `PG-${int(1000, 9999)}` },
        });
        paid = amount;
        paymentCount += 1;
      }
      const status = paid.gte(total) && total.gt(0) ? 'PAID' : paid.gt(0) ? 'PARTIALLY_PAID' : 'ISSUED';
      await prisma.invoice.update({ where: { id: invoice.id }, data: { amountPaid: paid, status } });
    }
  }

  // Faturas avulsas a partir de OS
  for (const job of jobs.filter((j) => ['COMPLETED', 'DELIVERED'].includes(j.status)).slice(0, 8)) {
    invoiceSeq += 1;
    const created = daysAgo(int(1, 45));
    const invoice = await prisma.invoice.create({
      data: { tenantId, branchId: job.branchId, jobCardId: job.id, customerId: job.customerId, number: `FT-${pad(invoiceSeq)}`, status: 'ISSUED', issueDate: created, subtotal: job.total, total: job.total },
    });
    const jLines = await prisma.jobLine.findMany({ where: { jobCardId: job.id } });
    for (let i = 0; i < jLines.length; i++) {
      const source = jLines[i]!;
      await prisma.invoiceLine.create({
        data: { invoiceId: invoice.id, type: source.type, serviceId: source.serviceId ?? undefined, partId: source.partId ?? undefined, description: source.description ?? undefined, quantity: source.quantity, unitPrice: source.unitPrice, discountValue: source.discountValue, taxBase: source.taxBase, taxAmount: source.taxAmount, total: source.total, jobLineId: source.id, sequence: i },
      });
    }
    invoiceCount += 1;
    if (chance(0.7)) {
      await prisma.payment.create({
        data: { tenantId, invoiceId: invoice.id, amount: job.total, methodId: paymentMethods.length ? pick(paymentMethods).id : undefined, paidAt: daysAgo(int(0, 15)) },
      });
      paymentCount += 1;
      await prisma.invoice.update({ where: { id: invoice.id }, data: { amountPaid: job.total, status: 'PAID' } });
    }
  }

  // ---------------- Compras ----------------
  let purchaseSeq = 0;
  let purchaseCount = 0;
  for (let i = 0; i < 10; i++) {
    purchaseSeq += 1;
    const supplier = pick(suppliers);
    const created = daysAgo(int(5, 80));
    const purchase = await prisma.purchase.create({
      data: { tenantId, branchId: branchA.id, locationId: locA.id, supplierId: supplier.id, number: `CP-${pad(purchaseSeq)}`, purchaseDate: created, status: 'RECEIVED' },
    });
    let subtotal = new Prisma.Decimal(0);
    const itemCount = int(1, 3);
    for (let it = 0; it < itemCount; it++) {
      const part = pick(parts);
      const qty = int(2, 12);
      const cost = PART_SEEDS.find((p) => p[1] === part.name)?.[2] ?? 40;
      const total = new Prisma.Decimal(qty).mul(cost);
      subtotal = subtotal.plus(total);
      await prisma.purchaseItem.create({ data: { purchaseId: purchase.id, partId: part.id, quantity: new Prisma.Decimal(qty), unitCost: new Prisma.Decimal(cost), total } });
      await prisma.stockMovement.create({
        data: { tenantId, branchId: branchA.id, locationId: locA.id, partId: part.id, type: 'PURCHASE', quantity: new Prisma.Decimal(qty), unitCost: new Prisma.Decimal(cost), refType: 'purchase', refId: purchase.id },
      });
    }
    await prisma.purchase.update({ where: { id: purchase.id }, data: { subtotal, total: subtotal } });
    await prisma.expense.create({
      data: { tenantId, branchId: branchA.id, category: 'Compras', description: `Compra CP-${pad(purchaseSeq)}`, amount: subtotal, expenseDate: created },
    });
    purchaseCount += 1;
  }

  // ---------------- Despesas ----------------
  let expenseCount = 0;
  for (let i = 0; i < 18; i++) {
    await prisma.expense.create({
      data: {
        tenantId,
        branchId: pick(branches).id,
        category: pick(EXPENSE_CATEGORIES),
        description: 'Despesa operacional',
        amount: new Prisma.Decimal(int(200, 5000)),
        expenseDate: daysAgo(int(1, 90)),
      },
    });
    expenseCount += 1;
  }

  // ---------------- Agendamentos ----------------
  let appointmentCount = 0;
  for (let i = 0; i < 25; i++) {
    const vehicle = pick(vehicles);
    const future = chance(0.5);
    await prisma.appointment.create({
      data: {
        tenantId,
        branchId: pick(branches).id,
        customerId: vehicle.customerId,
        vehicleId: vehicle.id,
        type: pick(jobTypes),
        status: pick(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const),
        scheduledStart: future ? daysAgo(-int(1, 20)) : daysAgo(int(1, 40)),
        notes: pick(['Cliente pediu urgência', 'Buscar às 17h', 'Aguardando peça', 'Prioridade alta', '']),
      },
    });
    appointmentCount += 1;
  }

  // ---------------- Sequências (continua numeração) ----------------
  const sequences: [string, string, number][] = [
    ['job_card', 'JC-', jobSeq + 1],
    ['quotation', 'OR-', quotationSeq + 1],
    ['invoice', 'FT-', invoiceSeq + 1],
    ['purchase', 'CP-', purchaseSeq + 1],
  ];
  for (const [entity, prefix, nextValue] of sequences) {
    await prisma.numberSequence.upsert({
      where: { tenantId_entity: { tenantId, entity } },
      update: { nextValue },
      create: { tenantId, entity, prefix, padding: 6, nextValue },
    });
  }

  return {
    branches: branches.length,
    customers: customerCount,
    vehicles: vehicles.length,
    parts: parts.length,
    services: services.length,
    jobCards: jobs.length,
    inspections: inspectionCount,
    quotations: quotationCount,
    invoices: invoiceCount,
    payments: paymentCount,
    purchases: purchaseCount,
    expenses: expenseCount,
    appointments: appointmentCount,
  };
}
