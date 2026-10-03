import { join } from 'node:path';
import { config } from 'dotenv';

// Carrega o .env da raiz do monorepo antes dos testes.
config({ path: join(__dirname, '..', '..', '..', '.env'), quiet: true });
