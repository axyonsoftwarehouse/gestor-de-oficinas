import { Prisma, PrismaClient } from '@prisma/client';
import { getTenantContext } from './tenant-context';

/**
 * Modelos que possuem `tenant_id`. O escopo de tenant é aplicado
 * automaticamente em creates e nas consultas de lista.
 *
 * Observação: o isolamento garantido é o RLS no PostgreSQL (ver prisma/rls.sql).
 * Esta extensão é uma camada de conveniência/defesa em profundidade.
 */
export const TENANT_MODELS: ReadonlySet<string> = new Set([
  'Branch',
  'Membership',
  'Customer',
  'VehicleBrand',
  'VehicleModel',
  'VehicleType',
  'VehicleColor',
  'VehicleFuelType',
  'Vehicle',
  'VehicleHistory',
  'ProductCategory',
  'Unit',
  'Tax',
  'ServiceCatalog',
  'PartCatalog',
  'Supplier',
  'ServicePart',
  'StockLocation',
  'StockMovement',
  'StockBalance',
  'Appointment',
  'BusinessHour',
  'Holiday',
  'InspectionTemplate',
  'Inspection',
  'JobCard',
  'Quotation',
  'Invoice',
  'Payment',
  'PaymentMethod',
  'Expense',
  'Attachment',
  'Note',
  'CustomFieldset',
  'CustomFieldDefinition',
  'CustomFieldValue',
  'AuditLog',
  'NumberSequence',
]);

const WHERE_SCOPED_OPS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
]);

function injectTenant<T>(data: T, tenantId: string): T {
  if (Array.isArray(data)) {
    return data.map((item) => ({ ...(item as object), tenantId })) as unknown as T;
  }
  return { ...(data as object), tenantId } as unknown as T;
}

export const tenantExtension = Prisma.defineExtension({
  name: 'tenant-scope',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_MODELS.has(model)) {
          return query(args);
        }
        const ctx = getTenantContext();
        if (!ctx?.tenantId) {
          return query(args);
        }

        const next = { ...(args as Record<string, unknown>) };

        if (operation === 'create') {
          next.data = injectTenant(next.data, ctx.tenantId);
        } else if (operation === 'createMany') {
          next.data = injectTenant(next.data ?? [], ctx.tenantId);
        } else if (operation === 'upsert') {
          next.create = injectTenant(next.create ?? {}, ctx.tenantId);
        } else if (WHERE_SCOPED_OPS.has(operation)) {
          next.where = { ...((next.where as object) ?? {}), tenantId: ctx.tenantId };
        }

        return query(next as typeof args);
      },
    },
  },
});

/** Client com escopo automático de tenant (uso normal da aplicação). */
export function createPrismaClient(options?: Prisma.PrismaClientOptions) {
  const base = new PrismaClient(options);
  return base.$extends(tenantExtension);
}

export type DatabaseClient = ReturnType<typeof createPrismaClient>;

/** Client sem escopo de tenant (operações de plataforma, ex.: login). */
export function createSystemPrismaClient(options?: Prisma.PrismaClientOptions) {
  return new PrismaClient(options);
}
