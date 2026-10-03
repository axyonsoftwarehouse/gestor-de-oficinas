import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  createPrismaClient,
  createSystemPrismaClient,
  type DatabaseClient,
} from '@gestor/database';

/**
 * `client` — escopo automático de tenant (uso normal, após autenticação).
 * `system` — sem escopo de tenant (login, tokens, provisionamento).
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: DatabaseClient = createPrismaClient();
  readonly system = createSystemPrismaClient();

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.client.$disconnect(), this.system.$disconnect()]);
  }
}
