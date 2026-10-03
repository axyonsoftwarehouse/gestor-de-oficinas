import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@gestor/database';

/**
 * Client Prisma com escopo automático de tenant.
 * O tenant é resolvido pelo TenantMiddleware via AsyncLocalStorage.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: DatabaseClient = createPrismaClient();

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
