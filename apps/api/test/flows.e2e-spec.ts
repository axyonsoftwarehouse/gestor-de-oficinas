import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'owner@oficina.local';
const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? 'password';
const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

describe('Fluxos (e2e)', () => {
  let app: INestApplication;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;
  let token = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    server = app.getHttpServer();

    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(200);
    token = login.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Autenticação', () => {
    it('retorna o usuário atual em /auth/me', async () => {
      const res = await request(server).get('/api/auth/me').set(auth(token)).expect(200);
      expect(res.body.email).toBe(ownerEmail);
      expect(Array.isArray(res.body.permissions)).toBe(true);
    });

    it('renova a sessão com o refresh token', async () => {
      const login = await request(server)
        .post('/api/auth/login')
        .send({ email: ownerEmail, password: ownerPassword })
        .expect(200);
      const res = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('rejeita credenciais inválidas', async () => {
      await request(server)
        .post('/api/auth/login')
        .send({ email: ownerEmail, password: 'senha-errada' })
        .expect(401);
    });
  });

  describe('Isolamento entre tenants (RLS)', () => {
    let newToken = '';
    const slug = `test-${suffix}`;
    const newOwnerEmail = `owner.${suffix}@test.local`;

    it('registra uma nova oficina e ela começa sem clientes', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          tenantName: `Oficina Teste ${suffix}`,
          slug,
          ownerName: 'Owner Teste',
          ownerEmail: newOwnerEmail,
          ownerPassword: 'senha12345',
        })
        .expect(201);
      newToken = res.body.accessToken as string;

      const customers = await request(server)
        .get('/api/customers')
        .set(auth(newToken))
        .expect(200);
      expect(customers.body.total).toBe(0);
    });

    it('não vaza dados entre tenants', async () => {
      const marker = `Cliente Isolado ${suffix}`;
      await request(server)
        .post('/api/customers')
        .set(auth(newToken))
        .send({ name: marker })
        .expect(201);

      const own = await request(server)
        .get(`/api/customers?search=${encodeURIComponent(marker)}`)
        .set(auth(newToken))
        .expect(200);
      expect(own.body.total).toBe(1);

      const other = await request(server)
        .get(`/api/customers?search=${encodeURIComponent(marker)}`)
        .set(auth(token))
        .expect(200);
      expect(other.body.total).toBe(0);
    });
  });

  describe('RBAC', () => {
    let mechanicToken = '';
    let memberId = '';
    let jobCardId = '';

    it('cria um membro com papel de mecânico', async () => {
      const roles = await request(server).get('/api/roles').set(auth(token)).expect(200);
      const mechanic = (roles.body as { id: string; slug: string }[]).find(
        (role) => role.slug === 'mechanic',
      );
      expect(mechanic).toBeDefined();

      const member = await request(server)
        .post('/api/users')
        .set(auth(token))
        .send({
          name: `Mecanico Teste ${suffix}`,
          email: `mec.${suffix}@test.local`,
          password: 'senha12345',
          roleIds: [mechanic!.id],
        })
        .expect(201);
      memberId = member.body.id as string;

      const login = await request(server)
        .post('/api/auth/login')
        .send({ email: `mec.${suffix}@test.local`, password: 'senha12345' })
        .expect(200);
      mechanicToken = login.body.accessToken as string;
    });

    it('mecânico pode ver veículos mas não papéis', async () => {
      await request(server).get('/api/vehicles').set(auth(mechanicToken)).expect(200);
      await request(server).get('/api/roles').set(auth(mechanicToken)).expect(403);
    });

    it('mecânico não pode faturar', async () => {
      const jobs = await request(server).get('/api/job-cards').set(auth(token)).expect(200);
      jobCardId = jobs.body.items[0].id as string;
      await request(server)
        .post(`/api/invoices/from-job/${jobCardId}`)
        .set(auth(mechanicToken))
        .expect(403);
    });

    it('desativa o membro', async () => {
      await request(server).delete(`/api/users/${memberId}`).set(auth(token)).expect(200);
    });
  });

  describe('Operação → orçamento → fatura → pagamento → estoque', () => {
    let branchId = '';
    let customerId = '';
    let vehicleId = '';
    let jobCardId = '';
    let invoiceId = '';
    let locationId = '';
    let partId = '';

    it('prepara filial, cliente e veículo', async () => {
      const branches = await request(server).get('/api/branches').set(auth(token)).expect(200);
      branchId = branches.body[0].id as string;

      const customer = await request(server)
        .post('/api/customers')
        .set(auth(token))
        .send({ name: `Cliente Fluxo ${suffix}` })
        .expect(201);
      customerId = customer.body.id as string;

      const vehicle = await request(server)
        .post('/api/vehicles')
        .set(auth(token))
        .send({ customerId, plate: `FLW${suffix.slice(-4)}` })
        .expect(201);
      vehicleId = vehicle.body.id as string;
    });

    it('cria OS, adiciona item e avança status', async () => {
      const job = await request(server)
        .post('/api/job-cards')
        .set(auth(token))
        .send({ branchId, type: 'REPAIR', customerId, vehicleId })
        .expect(201);
      jobCardId = job.body.id as string;
      expect(job.body.status).toBe('DRAFT');

      await request(server)
        .post(`/api/job-cards/${jobCardId}/lines`)
        .set(auth(token))
        .send({ type: 'LABOR', description: 'Mão de obra', quantity: 1, unitPrice: 100 })
        .expect(201);

      const detail = await request(server)
        .get(`/api/job-cards/${jobCardId}`)
        .set(auth(token))
        .expect(200);
      expect(Number(detail.body.total)).toBe(100);

      const scheduled = await request(server)
        .post(`/api/job-cards/${jobCardId}/transition`)
        .set(auth(token))
        .send({ status: 'SCHEDULED' })
        .expect(201);
      expect(scheduled.body.status).toBe('SCHEDULED');
    });

    it('gera orçamento, aprova e converte em fatura', async () => {
      const quotation = await request(server)
        .post('/api/quotations')
        .set(auth(token))
        .send({ branchId, customerId, jobCardId, copyFromJobCard: true })
        .expect(201);
      const quotationId = quotation.body.id as string;
      expect(quotation.body.lines.length).toBeGreaterThan(0);

      await request(server).post(`/api/quotations/${quotationId}/send`).set(auth(token)).expect(201);
      await request(server)
        .post(`/api/quotations/${quotationId}/approve`)
        .set(auth(token))
        .expect(201);

      const invoice = await request(server)
        .post(`/api/quotations/${quotationId}/convert-to-invoice`)
        .set(auth(token))
        .expect(201);
      invoiceId = invoice.body.id as string;
      expect(invoice.body.status).toBe('ISSUED');
      expect(Number(invoice.body.total)).toBe(100);
    });

    it('registra pagamentos parciais e quita a fatura', async () => {
      const partial = await request(server)
        .post(`/api/invoices/${invoiceId}/payments`)
        .set(auth(token))
        .send({ amount: 40 })
        .expect(201);
      expect(partial.body.status).toBe('PARTIALLY_PAID');

      const paid = await request(server)
        .post(`/api/invoices/${invoiceId}/payments`)
        .set(auth(token))
        .send({ amount: 60 })
        .expect(201);
      expect(paid.body.status).toBe('PAID');
      expect(Number(paid.body.amountPaid)).toBe(100);
    });

    it('movimenta o estoque e consome peça na OS', async () => {
      const part = await request(server)
        .post('/api/parts')
        .set(auth(token))
        .send({ name: `Peca Fluxo ${suffix}`, costPrice: 20, salePrice: 50, minStock: 1 })
        .expect(201);
      partId = part.body.id as string;

      const location = await request(server)
        .post('/api/stock/locations')
        .set(auth(token))
        .send({ branchId, name: `Local Fluxo ${suffix}` })
        .expect(201);
      locationId = location.body.id as string;

      const purchase = await request(server)
        .post('/api/stock/movements')
        .set(auth(token))
        .send({ locationId, partId, type: 'PURCHASE', quantity: 10, unitCost: 20 })
        .expect(201);
      expect(Number(purchase.body.balance.quantity)).toBe(10);

      const issue = await request(server)
        .post('/api/stock/issues')
        .set(auth(token))
        .send({ jobCardId, locationId, partId, quantity: 2 })
        .expect(201);
      expect(Number(issue.body.balance.quantity)).toBe(8);

      const detail = await request(server)
        .get(`/api/job-cards/${jobCardId}`)
        .set(auth(token))
        .expect(200);
      expect(detail.body.lines.length).toBe(2);
    });
  });
});
