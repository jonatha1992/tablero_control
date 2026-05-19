import { describe, it, expect } from 'vitest';
import { getPlan, planAllowsUnlimited, planLimit, PLANS } from '@/lib/mercadopago/plans';
import { parseExternalReference } from '@/lib/mercadopago/preapproval';
import { parseExternalReference as parseFromPreference } from '@/lib/mercadopago/preference';

// ─── getPlan ─────────────────────────────────────────────────────────────────

describe('getPlan()', () => {
  it('retorna definición correcta para free', () => {
    const plan = getPlan('free');
    expect(plan.id).toBe('free');
    expect(plan.name).toBe('Free');
    expect(plan.priceMonthly).toBe(0);
    expect(plan.priceYearly).toBe(0);
    expect(plan.currency).toBe('ARS');
    expect(plan.limits.users).toBe(3);
    expect(plan.limits.locations).toBe(1);
  });

  it('retorna definición correcta para basic', () => {
    const plan = getPlan('basic');
    expect(plan.id).toBe('basic');
    expect(plan.priceMonthly).toBe(15);
    expect(plan.priceYearly).toBe(12);
    expect(plan.limits.users).toBe(10);
    expect(plan.limits.locations).toBe(3);
  });

  it('retorna definición correcta para pro', () => {
    const plan = getPlan('pro');
    expect(plan.id).toBe('pro');
    expect(plan.priceMonthly).toBe(30);
    expect(plan.priceYearly).toBe(25);
    expect(plan.highlight).toBe(true);
    expect(plan.limits.users).toBe(50);
    expect(plan.limits.locations).toBe(10);
    expect(plan.limits.projects).toBe(-1); // unlimited
  });

  it('retorna definición correcta para enterprise', () => {
    const plan = getPlan('enterprise');
    expect(plan.id).toBe('enterprise');
    expect(plan.priceMonthly).toBe(-1); // precio a consultar
    expect(plan.limits.users).toBe(-1);
    expect(plan.limits.locations).toBe(-1);
    expect(plan.limits.projects).toBe(-1);
    expect(plan.limits.attachmentsPerMonth).toBe(-1);
  });

  it('el plan retornado es el mismo objeto que en PLANS', () => {
    expect(getPlan('pro')).toBe(PLANS['pro']);
  });
});

// ─── planAllowsUnlimited ──────────────────────────────────────────────────────

describe('planAllowsUnlimited()', () => {
  it('free: users NO es unlimited', () => {
    expect(planAllowsUnlimited('free', 'users')).toBe(false);
  });

  it('free: attachmentsPerMonth NO es unlimited', () => {
    expect(planAllowsUnlimited('free', 'attachmentsPerMonth')).toBe(false);
  });

  it('basic: attachmentsPerMonth ES unlimited (-1)', () => {
    expect(planAllowsUnlimited('basic', 'attachmentsPerMonth')).toBe(true);
  });

  it('basic: locations NO es unlimited', () => {
    expect(planAllowsUnlimited('basic', 'locations')).toBe(false);
  });

  it('pro: projects ES unlimited', () => {
    expect(planAllowsUnlimited('pro', 'projects')).toBe(true);
  });

  it('pro: users NO es unlimited', () => {
    expect(planAllowsUnlimited('pro', 'users')).toBe(false);
  });

  it('enterprise: todos los campos son unlimited', () => {
    expect(planAllowsUnlimited('enterprise', 'users')).toBe(true);
    expect(planAllowsUnlimited('enterprise', 'locations')).toBe(true);
    expect(planAllowsUnlimited('enterprise', 'projects')).toBe(true);
    expect(planAllowsUnlimited('enterprise', 'attachmentsPerMonth')).toBe(true);
  });
});

// ─── planLimit ────────────────────────────────────────────────────────────────

describe('planLimit()', () => {
  it('free: límite de users es 3', () => {
    expect(planLimit('free', 'users')).toBe(3);
  });

  it('free: límite de locations es 1', () => {
    expect(planLimit('free', 'locations')).toBe(1);
  });

  it('free: límite de projects es 2', () => {
    expect(planLimit('free', 'projects')).toBe(2);
  });

  it('free: límite de attachmentsPerMonth es 10', () => {
    expect(planLimit('free', 'attachmentsPerMonth')).toBe(10);
  });

  it('basic: límite de users es 10', () => {
    expect(planLimit('basic', 'users')).toBe(10);
  });

  it('pro: límite de users es 50', () => {
    expect(planLimit('pro', 'users')).toBe(50);
  });

  it('enterprise: -1 para todos (ilimitado)', () => {
    expect(planLimit('enterprise', 'users')).toBe(-1);
    expect(planLimit('enterprise', 'locations')).toBe(-1);
  });
});

// ─── Yearly pricing validation ───────────────────────────────────────────────

describe('yearly pricing discount', () => {
  it('planes pagos tienen priceYearly < priceMonthly', () => {
    const paidPlans: Array<'basic' | 'pro'> = ['basic', 'pro'];
    for (const id of paidPlans) {
      const plan = getPlan(id);
      expect(plan.priceYearly).toBeLessThan(plan.priceMonthly);
    }
  });

  it('free tiene precio 0 en ambas frecuencias', () => {
    const plan = getPlan('free');
    expect(plan.priceMonthly).toBe(0);
    expect(plan.priceYearly).toBe(0);
  });

  it('enterprise tiene -1 en ambas frecuencias', () => {
    const plan = getPlan('enterprise');
    expect(plan.priceMonthly).toBe(-1);
    expect(plan.priceYearly).toBe(-1);
  });
});

// ─── parseExternalReference ──────────────────────────────────────────────────

describe('parseExternalReference', () => {
  it('parsea formato "biz:id:plan:frequency"', () => {
    const result = parseExternalReference('biz:biz-123:pro:monthly');
    expect(result).toEqual({ businessId: 'biz-123', plan: 'pro', frequency: 'monthly' });
  });

  it('parsea yearly frequency', () => {
    const result = parseExternalReference('biz:abc:basic:yearly');
    expect(result).toEqual({ businessId: 'abc', plan: 'basic', frequency: 'yearly' });
  });

  it('retorna null para formato inválido', () => {
    expect(parseExternalReference('invalid')).toBeNull();
    expect(parseExternalReference('')).toBeNull();
    expect(parseExternalReference(undefined)).toBeNull();
  });

  it('retorna null para plan inválido', () => {
    expect(parseExternalReference('biz:id:gold:monthly')).toBeNull();
  });

  it('retorna null para frequency inválida', () => {
    expect(parseExternalReference('biz:id:pro:weekly')).toBeNull();
  });

  it('preference re-exporta misma función', () => {
    expect(parseFromPreference).toBe(parseExternalReference);
  });
});
