import { describe, expect, it } from 'vitest';
import { PLANS, isFeatureInPlan, normalizePlan } from '@gestor/shared';

describe('planos', () => {
  it('normaliza plano nulo ou desconhecido para o completo', () => {
    expect(normalizePlan(null)).toBe('completo');
    expect(normalizePlan(undefined)).toBe('completo');
    expect(normalizePlan('trial')).toBe('completo');
    expect(normalizePlan('essencial')).toBe('essencial');
  });

  it('o essencial esconde estoque, compras, despesas e configurações', () => {
    for (const feature of ['stock', 'purchase', 'expense', 'branch', 'role', 'user']) {
      expect(isFeatureInPlan(feature, 'essencial')).toBe(false);
    }
  });

  it('o essencial cobre o ciclo de uma OS do começo ao recebimento', () => {
    for (const feature of [
      'customer',
      'vehicle',
      'job_card',
      'quotation',
      'invoice',
      'payment',
      'service',
    ]) {
      expect(isFeatureInPlan(feature, 'essencial')).toBe(true);
    }
  });

  it('o completo libera qualquer feature', () => {
    for (const feature of ['stock', 'expense', 'branch', 'role', 'custom_field']) {
      expect(isFeatureInPlan(feature, 'completo')).toBe(true);
    }
  });

  it('toda feature do essencial está declarada no plano', () => {
    expect(PLANS.essencial.features).toContain('job_card');
    expect(PLANS.essencial.features).toHaveLength(8);
  });
});
