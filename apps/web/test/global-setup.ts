import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function run(script: string, env: NodeJS.ProcessEnv): void {
  execSync(`pnpm --filter @gestor/database ${script}`, {
    cwd: root,
    stdio: 'inherit',
    env,
  });
}

/**
 * Prepara o banco de TESTE: aplica migrations, garante o papel de aplicação,
 * aplica a RLS e limpa as tabelas. Exige um banco dedicado (Neon branch ou
 * Postgres local). Ao final, limpa novamente.
 */
export default function setup(): () => void {
  const direct = process.env.TEST_DIRECT_URL;
  const pooled = process.env.TEST_DATABASE_URL ?? direct;
  const app = process.env.TEST_APP_DATABASE_URL ?? process.env.APP_DATABASE_URL;

  if (!direct || !pooled || !app) {
    throw new Error(
      'Testes exigem TEST_DIRECT_URL, TEST_DATABASE_URL e TEST_APP_DATABASE_URL (banco de teste dedicado).',
    );
  }

  const env = {
    ...process.env,
    DIRECT_URL: direct,
    DATABASE_URL: pooled,
    APP_DATABASE_URL: app,
  };

  run('db:deploy:direct', env);
  run('db:app-role:direct', env);
  run('db:rls:direct', env);
  run('db:truncate:direct', env);

  return () => {
    run('db:truncate:direct', env);
  };
}
