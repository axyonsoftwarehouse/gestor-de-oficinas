import { provisionTenant } from '../src/server/auth/provision';
import { withTenant } from '../src/server/db/with-tenant';

let counter = 0;

function uniqueId(): string {
  counter += 1;
  return `${Date.now()}${counter}${Math.floor(Math.random() * 1000)}`;
}

export interface TestTenant {
  tenantId: string;
  userId: string;
  email: string;
  password: string;
  run<T>(fn: () => Promise<T>): Promise<T>;
}

/** Provisiona uma oficina isolada + owner para uso no teste. */
export async function createTestTenant(): Promise<TestTenant> {
  const id = uniqueId();
  const email = `owner.${id}@test.local`;
  const password = 'senha12345';

  const result = await provisionTenant({
    tenantName: `Oficina Teste ${id}`,
    slug: `t-${id}`,
    ownerName: 'Owner Teste',
    ownerEmail: email,
    ownerPassword: password,
  });

  return {
    tenantId: result.tenant.id,
    userId: result.user.id,
    email,
    password,
    run: (fn) => withTenant(result.tenant.id, result.user.id, fn),
  };
}
