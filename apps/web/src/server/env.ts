import 'server-only';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

/** Configuração server-side (validada sob demanda). */
export function serverEnv(): {
  betterAuthSecret: string;
  betterAuthUrl: string;
} {
  return {
    betterAuthSecret: required('BETTER_AUTH_SECRET'),
    betterAuthUrl: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  };
}
