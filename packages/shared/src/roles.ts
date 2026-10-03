import {
  listPermissionDefinitions,
  matchesPermissionPattern,
} from './permissions';

export interface RoleTemplate {
  slug: string;
  name: string;
  description: string;
  /** Papel de dono do tenant (recebe todas as permissões e poderes administrativos). */
  isOwner?: boolean;
  /**
   * Padrões de permissão. Aceita `*`, `feature.*` ou `feature.action`.
   * Ver `matchesPermissionPattern`.
   */
  permissionPatterns: readonly string[];
}

/** Papéis de sistema criados por tenant (templates iniciais). */
export const ROLE_TEMPLATES: readonly RoleTemplate[] = [
  {
    slug: 'owner',
    name: 'Proprietário',
    description: 'Acesso total, inclusive configurações e gestão de usuários.',
    isOwner: true,
    permissionPatterns: ['*'],
  },
  {
    slug: 'manager',
    name: 'Gerente',
    description: 'Opera e gerencia a oficina, sem alterar configurações críticas do tenant.',
    permissionPatterns: [
      '*',
      '!setting.edit',
      '!user.delete',
      '!role.delete',
    ],
  },
  {
    slug: 'advisor',
    name: 'Atendente',
    description: 'Balcão: clientes, veículos, agendamentos, inspeções e orçamentos.',
    permissionPatterns: [
      'dashboard.view',
      'customer.view',
      'customer.create',
      'customer.edit',
      'vehicle.view',
      'vehicle.create',
      'vehicle.edit',
      'appointment.*',
      'inspection.view',
      'inspection.create',
      'inspection.edit',
      'job_card.view',
      'job_card.create',
      'job_card.edit',
      'quotation.view',
      'quotation.create',
      'quotation.edit',
      'quotation.approve',
      'invoice.view',
      'payment.view',
      'report.view',
    ],
  },
  {
    slug: 'mechanic',
    name: 'Mecânico',
    description: 'Execução em campo: suas OS, inspeções e consumo de peças.',
    permissionPatterns: [
      'dashboard.view',
      'job_card.view_own',
      'job_card.edit',
      'inspection.view_own',
      'inspection.create',
      'inspection.edit',
      'vehicle.view',
      'part.view',
      'stock.view',
      'stock.create',
    ],
  },
  {
    slug: 'accountant',
    name: 'Financeiro',
    description: 'Faturamento, pagamentos, despesas e relatórios.',
    permissionPatterns: [
      'dashboard.view',
      'customer.view',
      'quotation.view',
      'invoice.*',
      'payment.*',
      'expense.*',
      'report.view',
    ],
  },
];

/**
 * Resolve os códigos de permissão de um template a partir do catálogo.
 * Suporta negação com prefixo `!` (ex.: `!setting.edit`), aplicada após inclusões.
 */
export function resolveRolePermissions(template: RoleTemplate): string[] {
  const all = listPermissionDefinitions().map((p) => p.code);
  const positives = template.permissionPatterns.filter((p) => !p.startsWith('!'));
  const negatives = template.permissionPatterns
    .filter((p) => p.startsWith('!'))
    .map((p) => p.slice(1));

  const granted = all.filter((code) => matchesPermissionPattern(code, positives));
  return granted.filter((code) => !matchesPermissionPattern(code, negatives));
}
