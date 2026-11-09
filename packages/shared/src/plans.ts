/**
 * Planos comerciais e o recorte de features que cada um expõe na interface.
 *
 * O plano NÃO concede permissão: o RBAC continua sendo a fonte de verdade da
 * autorização no servidor. Ele apenas reduz o que aparece no menu — a oficina
 * pequena enxerga o essencial e o dono liga o completo quando precisar.
 */

export const PLAN_ESSENCIAL = 'essencial';
export const PLAN_COMPLETO = 'completo';

export type PlanId = 'essencial' | 'completo';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  /** Features visíveis no menu. `*` libera todas as features do RBAC. */
  features: readonly string[];
}

/**
 * O mínimo que resolve o dia de uma oficina pequena: abrir OS, orçar, faturar
 * e receber. Estoque, compras, despesas e configurações ficam para depois.
 */
export const ESSENTIAL_FEATURES: readonly string[] = [
  'dashboard',
  'job_card',
  'quotation',
  'invoice',
  'payment',
  'customer',
  'vehicle',
  'service',
];

export const PLANS: Record<PlanId, PlanDefinition> = {
  essencial: {
    id: 'essencial',
    name: 'Essencial',
    description: 'Ordem de serviço, orçamento e recebimento.',
    features: ESSENTIAL_FEATURES,
  },
  completo: {
    id: 'completo',
    name: 'Completo',
    description: 'Operação, cadastros, estoque, financeiro e configurações.',
    features: ['*'],
  },
};

/** Planos desconhecidos (inclusive o `trial` legado) caem no completo. */
export function normalizePlan(plan?: string | null): PlanId {
  return plan === PLAN_ESSENCIAL ? PLAN_ESSENCIAL : PLAN_COMPLETO;
}

export function isFeatureInPlan(feature: string, plan?: string | null): boolean {
  const definition = PLANS[normalizePlan(plan)];
  return (
    definition.features.includes('*') || definition.features.includes(feature)
  );
}
