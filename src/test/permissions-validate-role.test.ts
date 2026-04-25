import { describe, it, expect } from 'vitest';
import { validateCustomRole, isCustomRoleValid } from '@/lib/permissions/validate-role';
import { EMPTY_PERMISSIONS } from '@/types/domain/custom-role';
import type { PermissionSet } from '@/types/domain/custom-role';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRole(overrides: {
  name?: string;
  slug?: string;
  color?: string;
  permissions?: Partial<PermissionSet>;
} = {}) {
  return {
    name: overrides.name ?? 'Mi Rol',
    slug: overrides.slug ?? 'mi_rol',
    color: overrides.color ?? '#aabbcc',
    baseRole: 'miembro' as const,
    permissions: { ...EMPTY_PERMISSIONS, ...(overrides.permissions ?? {}) },
  };
}

// ─── name validation ──────────────────────────────────────────────────────────

describe('validateCustomRole() — name', () => {
  it('nombre con menos de 2 caracteres → error en field "name"', () => {
    const errors = validateCustomRole(makeRole({ name: 'A' }), 'pro');
    expect(errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('nombre vacío → error', () => {
    const errors = validateCustomRole(makeRole({ name: '' }), 'pro');
    expect(errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('nombre válido (≥2 chars) → sin error de name', () => {
    const errors = validateCustomRole(makeRole({ name: 'Ok' }), 'pro');
    expect(errors.some((e) => e.field === 'name')).toBe(false);
  });

  it('nombre solo con espacios → error', () => {
    const errors = validateCustomRole(makeRole({ name: '  ' }), 'pro');
    expect(errors.some((e) => e.field === 'name')).toBe(true);
  });
});

// ─── slug validation ──────────────────────────────────────────────────────────

describe('validateCustomRole() — slug', () => {
  it('slug con mayúsculas → error', () => {
    const errors = validateCustomRole(makeRole({ slug: 'MiRol' }), 'pro');
    expect(errors.some((e) => e.field === 'slug')).toBe(true);
  });

  it('slug con espacios → error', () => {
    const errors = validateCustomRole(makeRole({ slug: 'mi rol' }), 'pro');
    expect(errors.some((e) => e.field === 'slug')).toBe(true);
  });

  it('slug con guion → error (solo se permite guion bajo)', () => {
    const errors = validateCustomRole(makeRole({ slug: 'mi-rol' }), 'pro');
    expect(errors.some((e) => e.field === 'slug')).toBe(true);
  });

  it('slug válido (minúsculas, números, guion bajo) → sin error', () => {
    const errors = validateCustomRole(makeRole({ slug: 'mi_rol_2' }), 'pro');
    expect(errors.some((e) => e.field === 'slug')).toBe(false);
  });
});

// ─── color validation ─────────────────────────────────────────────────────────

describe('validateCustomRole() — color', () => {
  it('color sin # → error', () => {
    const errors = validateCustomRole(makeRole({ color: 'aabbcc' }), 'pro');
    expect(errors.some((e) => e.field === 'color')).toBe(true);
  });

  it('color con menos de 6 hex → error', () => {
    const errors = validateCustomRole(makeRole({ color: '#abc' }), 'pro');
    expect(errors.some((e) => e.field === 'color')).toBe(true);
  });

  it('color con caracteres no hex → error', () => {
    const errors = validateCustomRole(makeRole({ color: '#xxyyzz' }), 'pro');
    expect(errors.some((e) => e.field === 'color')).toBe(true);
  });

  it('color válido #rrggbb → sin error', () => {
    const errors = validateCustomRole(makeRole({ color: '#1a2b3c' }), 'pro');
    expect(errors.some((e) => e.field === 'color')).toBe(false);
  });

  it('color válido mayúsculas #RRGGBB → sin error', () => {
    const errors = validateCustomRole(makeRole({ color: '#AABBCC' }), 'pro');
    expect(errors.some((e) => e.field === 'color')).toBe(false);
  });
});

// ─── billing permissions ───────────────────────────────────────────────────────

describe('validateCustomRole() — billing', () => {
  it('billing.manage=true → error en permissions.billing', () => {
    const perms = { ...EMPTY_PERMISSIONS, billing: { read: false, manage: true } };
    const errors = validateCustomRole(makeRole({ permissions: perms }), 'enterprise');
    expect(errors.some((e) => e.field === 'permissions.billing')).toBe(true);
  });

  it('billing.read=true → error en permissions.billing', () => {
    const perms = { ...EMPTY_PERMISSIONS, billing: { read: true, manage: false } };
    const errors = validateCustomRole(makeRole({ permissions: perms }), 'enterprise');
    expect(errors.some((e) => e.field === 'permissions.billing')).toBe(true);
  });

  it('billing.read=false y billing.manage=false → sin error de billing', () => {
    const errors = validateCustomRole(makeRole(), 'enterprise');
    expect(errors.some((e) => e.field === 'permissions.billing')).toBe(false);
  });
});

// ─── reports.export — plan restrictions ────────────────────────────────────────

describe('validateCustomRole() — reports.export por plan', () => {
  const permsWithExport = { ...EMPTY_PERMISSIONS, reports: { read: true, export: true } };

  it('reports.export=true con plan free → error', () => {
    const errors = validateCustomRole(makeRole({ permissions: permsWithExport }), 'free');
    expect(errors.some((e) => e.field === 'permissions.reports.export')).toBe(true);
  });

  it('reports.export=true con plan basic → error', () => {
    const errors = validateCustomRole(makeRole({ permissions: permsWithExport }), 'basic');
    expect(errors.some((e) => e.field === 'permissions.reports.export')).toBe(true);
  });

  it('reports.export=true con plan pro → OK (sin error)', () => {
    const errors = validateCustomRole(makeRole({ permissions: permsWithExport }), 'pro');
    expect(errors.some((e) => e.field === 'permissions.reports.export')).toBe(false);
  });

  it('reports.export=true con plan enterprise → OK', () => {
    const errors = validateCustomRole(makeRole({ permissions: permsWithExport }), 'enterprise');
    expect(errors.some((e) => e.field === 'permissions.reports.export')).toBe(false);
  });
});

// ─── users.changeRole ─────────────────────────────────────────────────────────

describe('validateCustomRole() — users.changeRole', () => {
  it('users.changeRole=true → siempre error', () => {
    const perms = { ...EMPTY_PERMISSIONS, users: { ...EMPTY_PERMISSIONS.users, changeRole: true } };
    const errors = validateCustomRole(makeRole({ permissions: perms }), 'enterprise');
    expect(errors.some((e) => e.field === 'permissions.users.changeRole')).toBe(true);
  });

  it('users.changeRole=false → sin error', () => {
    const errors = validateCustomRole(makeRole(), 'enterprise');
    expect(errors.some((e) => e.field === 'permissions.users.changeRole')).toBe(false);
  });
});

// ─── isCustomRoleValid ────────────────────────────────────────────────────────

describe('isCustomRoleValid()', () => {
  it('retorna true cuando no hay errores', () => {
    expect(isCustomRoleValid(makeRole(), 'pro')).toBe(true);
  });

  it('retorna false cuando hay al menos un error', () => {
    expect(isCustomRoleValid(makeRole({ name: 'X' }), 'pro')).toBe(false);
  });
});
