/**
 * Checagens de permissão no cliente — servem só para esconder o que o usuário não
 * pode usar. A autorização real continua no servidor (`runRoute`).
 */

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
