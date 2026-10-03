/**
 * Catálogo canônico de permissões (RBAC).
 *
 * Cada permissão é identificada por `feature.action` (ex.: `invoice.approve`).
 * Ações: view | view_own | create | edit | delete | approve.
 *
 * Este catálogo é a fonte de verdade usada pelo seed do banco e pela API.
 */

export const PERMISSION_ACTIONS = [
  'view',
  'view_own',
  'create',
  'edit',
  'delete',
  'approve',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_CATALOG = {
  dashboard: ['view'],
  customer: ['view', 'view_own', 'create', 'edit', 'delete'],
  vehicle: ['view', 'view_own', 'create', 'edit', 'delete'],
  appointment: ['view', 'view_own', 'create', 'edit', 'delete'],
  inspection: ['view', 'view_own', 'create', 'edit', 'delete', 'approve'],
  job_card: ['view', 'view_own', 'create', 'edit', 'delete', 'approve'],
  quotation: ['view', 'view_own', 'create', 'edit', 'delete', 'approve'],
  invoice: ['view', 'view_own', 'create', 'edit', 'delete', 'approve'],
  payment: ['view', 'create', 'delete'],
  service: ['view', 'create', 'edit', 'delete'],
  part: ['view', 'create', 'edit', 'delete'],
  stock: ['view', 'create', 'edit', 'delete', 'approve'],
  supplier: ['view', 'create', 'edit', 'delete'],
  expense: ['view', 'view_own', 'create', 'edit', 'delete', 'approve'],
  report: ['view'],
  user: ['view', 'create', 'edit', 'delete'],
  role: ['view', 'create', 'edit', 'delete'],
  branch: ['view', 'create', 'edit', 'delete'],
  custom_field: ['view', 'create', 'edit', 'delete'],
  setting: ['view', 'edit'],
} as const satisfies Record<string, readonly PermissionAction[]>;

export type PermissionFeature = keyof typeof PERMISSION_CATALOG;

export interface PermissionDefinition {
  code: string;
  feature: PermissionFeature;
  action: PermissionAction;
}

export function permissionCode(feature: string, action: string): string {
  return `${feature}.${action}`;
}

/** Expande o catálogo em registros de permissão prontos para persistir. */
export function listPermissionDefinitions(): PermissionDefinition[] {
  const out: PermissionDefinition[] = [];
  for (const [feature, actions] of Object.entries(PERMISSION_CATALOG)) {
    for (const action of actions) {
      out.push({
        code: permissionCode(feature, action),
        feature: feature as PermissionFeature,
        action: action as PermissionAction,
      });
    }
  }
  return out;
}

/**
 * Verifica se um código de permissão casa com uma lista de padrões.
 * Padrões aceitos: `*` (tudo), `feature.*` (toda ação da feature),
 * `feature.action`.
 */
export function matchesPermissionPattern(code: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern === '*') return true;
    if (pattern.endsWith('.*')) {
      const feature = pattern.slice(0, -2);
      return code.startsWith(`${feature}.`);
    }
    return code === pattern;
  });
}
