import { describe, expect, it } from 'vitest';
import { system } from '../src/server/db/prisma';
import {
  createCustomer,
  listCustomers,
} from '../src/server/services/customers.service';
import { createTestTenant } from './helpers';

describe('RLS multi-tenant', () => {
  it('a conexão usa o papel app_gestor (NOBYPASSRLS)', async () => {
    const rows = await system.$queryRaw<{ current_user: string }[]>`
      SELECT current_user
    `;
    expect(rows[0]?.current_user).toBe('app_gestor');
  });

  it('sem contexto de tenant, nenhuma linha de negócio é visível', async () => {
    const rows = await system.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) AS count FROM customers
    `;
    expect(Number(rows[0]?.count)).toBe(0);
  });

  it('isola os dados entre tenants', async () => {
    const a = await createTestTenant();
    const b = await createTestTenant();
    const marker = `Cliente RLS ${a.tenantId}`;

    await a.run(() => createCustomer({ name: marker }));

    const own = await a.run(() => listCustomers({ search: marker }));
    const other = await b.run(() => listCustomers({ search: marker }));

    expect(own.total).toBe(1);
    expect(other.total).toBe(0);
  });
});
