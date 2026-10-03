export { Prisma, PrismaClient } from '@prisma/client';
export {
  TENANT_MODELS,
  createPrismaClient,
  createSystemPrismaClient,
  tenantExtension,
} from './tenant-extension';
export type { DatabaseClient } from './tenant-extension';
export {
  getTenantContext,
  requireTenantId,
  runWithTenant,
} from './tenant-context';
export type { TenantContext } from './tenant-context';
