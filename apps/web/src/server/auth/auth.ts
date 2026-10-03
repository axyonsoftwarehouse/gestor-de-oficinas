import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { system } from '../db/prisma';

/**
 * Instância server-side do Better Auth.
 *
 * Usa as tabelas de plataforma (sem RLS): users, sessions, accounts, verifications.
 * `image` é mapeado para a coluna existente `avatarUrl` e os UUIDs são gerados
 * pelo Prisma (`generateId: false`), alinhados ao schema.
 */
export const auth = betterAuth({
  database: prismaAdapter(system, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  user: {
    fields: { image: 'avatarUrl' },
    additionalFields: {
      isActive: { type: 'boolean', required: false, input: false },
      isPlatformAdmin: { type: 'boolean', required: false, input: false },
      defaultTenantId: { type: 'string', required: false, input: false },
    },
  },
  advanced: {
    database: { generateId: false },
  },
});
