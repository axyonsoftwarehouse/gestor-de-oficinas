import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
const directUrl = process.env.TEST_DIRECT_URL ?? process.env.DIRECT_URL ?? '';
const appUrl =
  process.env.TEST_APP_DATABASE_URL ?? process.env.APP_DATABASE_URL ?? '';
const emptyModule = fileURLToPath(new URL('./test/empty.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: { 'server-only': emptyModule },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    globalSetup: ['test/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    env: {
      DATABASE_URL: databaseUrl,
      DIRECT_URL: directUrl,
      APP_DATABASE_URL: appUrl,
    },
  },
});
