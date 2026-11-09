/**
 * Checagens de permissão no cliente — servem só para esconder o que o usuário não
 * pode usar. A autorização real continua no servidor (`runRoute`).
 */

import { isFeatureInPlan } from '@gestor/shared';

export function hasPermission(granted: readonly string[], code: string): boolean {
  if (granted.includes('*') || granted.includes(code)) return true;
  const feature = code.split('.')[0];
  return granted.includes(`${feature}.*`);
}

/** Pode ver a feature (lista completa ou apenas os próprios registros). */
export function canView(granted: readonly string[], feature: string): boolean {
  return (
    hasPermission(granted, `${feature}.view`) || hasPermission(granted, `${feature}.view_own`)
  );
}

/**
 * Pode ver a feature **e** ela pertence ao plano da oficina.
 * `plan` nulo/desconhecido resolve para o plano completo (comportamento legado).
 */
export function canUseFeature(
  granted: readonly string[],
  feature: string,
  plan?: string | null,
): boolean {
  return canView(granted, feature) && isFeatureInPlan(feature, plan);
}
