import { describe, it, expect } from 'vitest';
import {
  resolvePermissions,
  basePermissions,
  ADMIN_PERMISSIONS,
  RESPONSABLE_PERMISSIONS,
  MIEMBRO_PERMISSIONS,
  VIEWER_PERMISSIONS,
} from '@/lib/permissions/resolve';
import { EMPTY_PERMISSIONS } from '@/types/domain/custom-role';
import type { CustomRole, PermissionSet } from '@/types/domain/custom-role';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCustomRole(overrides: Partial<PermissionSet>, isActive = true): CustomRole {
  return {
    id: 'cr-1',
    businessId: 'biz-1',
    name: 'Test Role',
    slug: 'test_role',
    description: 'Rol de prueba',
    color: '#123456',
    icon: 'user',
    baseRole: 'miembro',
    scope: { type: 'business' },
    isActive,
    isSystem: false,
    userCount: 0,
    createdBy: 'user-1',
    permissions: { ...EMPTY_PERMISSIONS, ...overrides },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ─── basePermissions ─────────────────────────────────────────────────────────

describe('basePermissions()', () => {
  it('superadmin → ADMIN_PERMISSIONS', () => {
    expect(basePermissions('superadmin')).toEqual(ADMIN_PERMISSIONS);
  });

  it('admin → ADMIN_PERMISSIONS', () => {
    expect(basePermissions('admin')).toEqual(ADMIN_PERMISSIONS);
  });

  it('responsable → RESPONSABLE_PERMISSIONS', () => {
    expect(basePermissions('responsable')).toEqual(RESPONSABLE_PERMISSIONS);
  });

  it('miembro → MIEMBRO_PERMISSIONS', () => {
    expect(basePermissions('miembro')).toEqual(MIEMBRO_PERMISSIONS);
  });

  it('viewer → VIEWER_PERMISSIONS', () => {
    expect(basePermissions('viewer')).toEqual(VIEWER_PERMISSIONS);
  });
});

// ─── resolvePermissions — sin customRole ─────────────────────────────────────

describe('resolvePermissions() sin customRole', () => {
  it('retorna basePermissions para admin cuando no hay customRole', () => {
    expect(resolvePermissions({ role: 'admin' })).toEqual(ADMIN_PERMISSIONS);
  });

  it('retorna basePermissions para miembro cuando customRoles=null', () => {
    expect(resolvePermissions({ role: 'miembro' }, null)).toEqual(MIEMBRO_PERMISSIONS);
  });

  it('retorna basePermissions cuando customRoles=undefined', () => {
    expect(resolvePermissions({ role: 'responsable' }, undefined)).toEqual(RESPONSABLE_PERMISSIONS);
  });

  it('retorna basePermissions cuando customRoles=[]', () => {
    expect(resolvePermissions({ role: 'miembro' }, [])).toEqual(MIEMBRO_PERMISSIONS);
  });
});

// ─── resolvePermissions — customRole inactivo ────────────────────────────────

describe('resolvePermissions() con customRole INACTIVO', () => {
  it('ignora el customRole y retorna basePermissions sin modificar', () => {
    const custom = makeCustomRole({
      tasks: { read: false, create: false, update: false, delete: false, assign: false, comment: false },
    }, false); // isActive = false

    const result = resolvePermissions({ role: 'miembro' }, [custom]);
    expect(result).toEqual(MIEMBRO_PERMISSIONS);
  });
});

// ─── resolvePermissions — customRole activo (intersección AND) ───────────────

describe('resolvePermissions() con customRole ACTIVO', () => {
  it('ambos true → true (permiso concedido)', () => {
    // miembro tiene tasks.read=true, custom también true
    const custom = makeCustomRole({
      tasks: { read: true, create: false, update: true, delete: false, assign: false, comment: true },
    });
    const result = resolvePermissions({ role: 'miembro' }, [custom]);
    expect(result.tasks.read).toBe(true);
    expect(result.tasks.comment).toBe(true);
  });

  it('base true + custom false → false (custom deshabilita)', () => {
    // miembro tiene tasks.read=true, custom lo deshabilita
    const custom = makeCustomRole({
      tasks: { read: false, create: false, update: true, delete: false, assign: false, comment: false },
    });
    const result = resolvePermissions({ role: 'miembro' }, [custom]);
    expect(result.tasks.read).toBe(false);
    expect(result.tasks.comment).toBe(false);
  });

  it('base false + custom true → false (base limita)', () => {
    // miembro NO puede crear (base false), aunque custom diga true
    const custom = makeCustomRole({
      tasks: { read: true, create: true, update: true, delete: true, assign: true, comment: true },
    });
    const result = resolvePermissions({ role: 'miembro' }, [custom]);
    expect(result.tasks.create).toBe(false); // miembro base = false
    expect(result.tasks.delete).toBe(false);
    expect(result.tasks.assign).toBe(false);
  });

  it('intersecciona todos los módulos correctamente', () => {
    const custom = makeCustomRole({
      tasks: { read: true, create: false, update: true, delete: false, assign: false, comment: true },
      reports: { read: true, export: true },
      attachments: { upload: true, delete: true },
    });
    const result = resolvePermissions({ role: 'responsable' }, [custom]);
    // responsable tiene reports.export=false (base), custom=true → false
    expect(result.reports.export).toBe(false);
    // responsable tiene tasks.read=true, custom=true → true
    expect(result.tasks.read).toBe(true);
  });

  it('union de dos custom roles — OR antes del AND con base', () => {
    // rol1 habilita tasks.read; rol2 habilita tasks.comment; miembro base permite ambos
    const rol1 = makeCustomRole({ tasks: { read: true, create: false, update: false, delete: false, assign: false, comment: false } });
    const rol2 = makeCustomRole({ tasks: { read: false, create: false, update: false, delete: false, assign: false, comment: true } });
    const result = resolvePermissions({ role: 'miembro' }, [rol1, rol2]);
    expect(result.tasks.read).toBe(true);
    expect(result.tasks.comment).toBe(true);
  });

  it('union de dos custom roles inactivos retorna basePermissions', () => {
    const rol1 = makeCustomRole({}, false);
    const rol2 = makeCustomRole({}, false);
    const result = resolvePermissions({ role: 'miembro' }, [rol1, rol2]);
    expect(result).toEqual(MIEMBRO_PERMISSIONS);
  });
});
