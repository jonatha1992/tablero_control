import { describe, it, expect } from 'vitest';
import { assertSameTenant, isSameTenant, TenantMismatchError } from '@/lib/permissions/tenant-guard';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const userA = { role: 'admin' as const, businessId: 'biz-A' };
const superadmin = { role: 'superadmin' as const, businessId: undefined };
const userNoBiz = { role: 'miembro' as const, businessId: undefined };

// ─── assertSameTenant ────────────────────────────────────────────────────────

describe('assertSameTenant()', () => {
  it('no lanza cuando businessIds coinciden', () => {
    expect(() => assertSameTenant(userA, { businessId: 'biz-A' })).not.toThrow();
  });

  it('lanza TenantMismatchError cuando businessIds NO coinciden', () => {
    expect(() => assertSameTenant(userA, { businessId: 'biz-B' })).toThrow(TenantMismatchError);
  });

  it('TenantMismatchError contiene los businessIds correctos', () => {
    let error!: TenantMismatchError;
    try {
      assertSameTenant(userA, { businessId: 'biz-B' });
    } catch (e) {
      error = e as TenantMismatchError;
    }
    expect(error.expected).toBe('biz-A');
    expect(error.got).toBe('biz-B');
    expect(error.name).toBe('TenantMismatchError');
  });

  it('superadmin bypasea el guard (nunca lanza)', () => {
    expect(() => assertSameTenant(superadmin, { businessId: 'biz-A' })).not.toThrow();
    expect(() => assertSameTenant(superadmin, { businessId: 'biz-B' })).not.toThrow();
    expect(() => assertSameTenant(superadmin, {})).not.toThrow();
  });

  it('lanza si el user no tiene businessId', () => {
    expect(() => assertSameTenant(userNoBiz, { businessId: 'biz-A' })).toThrow(TenantMismatchError);
  });

  it('lanza si el recurso no tiene businessId', () => {
    expect(() => assertSameTenant(userA, {})).toThrow(TenantMismatchError);
  });

  it('lanza si ambos carecen de businessId (no superadmin)', () => {
    expect(() => assertSameTenant(userNoBiz, {})).toThrow(TenantMismatchError);
  });
});

// ─── isSameTenant ─────────────────────────────────────────────────────────────

describe('isSameTenant()', () => {
  it('retorna true cuando coinciden', () => {
    expect(isSameTenant(userA, { businessId: 'biz-A' })).toBe(true);
  });

  it('retorna false cuando no coinciden', () => {
    expect(isSameTenant(userA, { businessId: 'biz-B' })).toBe(false);
  });

  it('superadmin retorna true siempre', () => {
    expect(isSameTenant(superadmin, { businessId: 'biz-A' })).toBe(true);
    expect(isSameTenant(superadmin, {})).toBe(true);
  });

  it('retorna false si el user no tiene businessId', () => {
    expect(isSameTenant(userNoBiz, { businessId: 'biz-A' })).toBe(false);
  });

  it('retorna false si el recurso no tiene businessId', () => {
    expect(isSameTenant(userA, {})).toBe(false);
  });
});

// ─── TenantMismatchError ──────────────────────────────────────────────────────

describe('TenantMismatchError', () => {
  it('es instancia de Error', () => {
    const err = new TenantMismatchError('A', 'B');
    expect(err).toBeInstanceOf(Error);
  });

  it('mensaje incluye ambos valores', () => {
    const err = new TenantMismatchError('biz-1', 'biz-2');
    expect(err.message).toContain('biz-1');
    expect(err.message).toContain('biz-2');
  });

  it('acepta valores undefined', () => {
    const err = new TenantMismatchError(undefined, undefined);
    expect(err.message).toContain('n/a');
  });
});
