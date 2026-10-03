import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication;
  let token = '';

  const email = process.env.SEED_OWNER_EMAIL ?? 'owner@oficina.local';
  const password = process.env.SEED_OWNER_PASSWORD ?? 'password';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(process.env.API_GLOBAL_PREFIX ?? 'api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health responde ok', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(response.body.status).toBe('ok');
  });

  it('login retorna token de acesso', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    expect(response.body.accessToken).toBeDefined();
    token = response.body.accessToken as string;
  });

  it('bloqueia rota protegida sem token', async () => {
    await request(app.getHttpServer()).get('/api/customers').expect(401);
  });

  it('lista clientes com token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(response.body.items)).toBe(true);
  });
});
