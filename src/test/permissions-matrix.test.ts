import { describe, it, expect } from 'vitest';
import { can } from '@/lib/permissions/matrix';
import { EMPTY_PERMISSIONS } from '@/types/domain/custom-role';
import type { PermissionSet } from '@/types/domain/custom-role';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const superadmin = { id: 'sa-1', role: 'superadmin' as const, businessId: undefined };
const admin      = { id: 'adm-1', role: 'admin' as const, businessId: 'biz-A' };
const responsable = { id: 'res-1', role: 'responsable' as const, businessId: 'biz-A' };
const miembro    = { id: 'mem-1', role: 'miembro' as const, businessId: 'biz-A' };
const viewer     = { id: 'vie-1', role: 'viewer' as const, businessId: 'biz-A' };

const resourceA  = { businessId: 'biz-A' };
const resourceB  = { businessId: 'biz-B' };

// ─── superadmin ─────────────────────────────────────────────────────────────

describe('can() — superadmin', () => {
  it('tiene todos los permisos de plataforma', () => {
    expect(can(superadmin, 'platform.businesses.list')).toBe(true);
    expect(can(superadmin, 'platform.businesses.create')).toBe(true);
    expect(can(superadmin, 'platform.businesses.suspend')).toBe(true);
    expect(can(superadmin, 'platform.businesses.reactivate')).toBe(true);
    expect(can(superadmin, 'platform.metrics.read')).toBe(true);
    expect(can(superadmin, 'platform.users.read')).toBe(true);
    expect(can(superadmin, 'platform.plans.manage')).toBe(true);
    expect(can(superadmin, 'platform.subscriptions.force')).toBe(true);
    expect(can(superadmin, 'platform.audit.read')).toBe(true);
    expect(can(superadmin, 'platform.impersonate')).toBe(true);
  });

  it('puede leer tareas globalmente (tenant bypass)', () => {
    expect(can(superadmin, 'task.read')).toBe(true);
    expect(can(superadmin, 'task.read', resourceA)).toBe(true);
    expect(can(superadmin, 'task.read', resourceB)).toBe(true);
  });

  it('puede leer reportes globalmente', () => {
    expect(can(superadmin, 'business.reports.read')).toBe(true);
    expect(can(superadmin, 'business.reports.read', resourceA)).toBe(true);
  });

  it('NO puede escribir en negocio sin businessId activo', () => {
    const noBiz = { ...superadmin, businessId: undefined };
    expect(can(noBiz, 'task.create')).toBe(false);
    expect(can(noBiz, 'task.delete')).toBe(false);
    expect(can(noBiz, 'business.settings.update')).toBe(false);
  });

  it('con negocio activo puede crear, editar y eliminar tareas', () => {
    const saInBiz = { ...superadmin, businessId: 'biz-A' };
    expect(can(saInBiz, 'task.create')).toBe(true);
    expect(can(saInBiz, 'task.delete')).toBe(true);
    expect(can(saInBiz, 'task.update.any')).toBe(true);
  });

  it('con negocio activo puede gestionar miembros del espacio', () => {
    const saInBiz = { ...superadmin, businessId: 'biz-A' };
    expect(can(saInBiz, 'business.users.crud', resourceA)).toBe(true);
    expect(can(saInBiz, 'business.users.changeRole', resourceA)).toBe(true);
  });
});

// ─── admin ───────────────────────────────────────────────────────────────────

describe('can() — admin', () => {
  it('tiene permisos de negocio completos', () => {
    expect(can(admin, 'business.settings.update', resourceA)).toBe(true);
    expect(can(admin, 'business.users.crud', resourceA)).toBe(true);
    expect(can(admin, 'business.roles.crud', resourceA)).toBe(true);
    expect(can(admin, 'business.locations.crud', resourceA)).toBe(true);
    expect(can(admin, 'business.teams.crud', resourceA)).toBe(true);
    expect(can(admin, 'business.reports.read', resourceA)).toBe(true);
    expect(can(admin, 'business.reports.export', resourceA)).toBe(true);
  });

  it('puede gestionar tareas en su businessId', () => {
    expect(can(admin, 'task.read', resourceA)).toBe(true);
    expect(can(admin, 'task.create', resourceA)).toBe(true);
    expect(can(admin, 'task.update.any', resourceA)).toBe(true);
    expect(can(admin, 'task.delete', resourceA)).toBe(true);
    expect(can(admin, 'task.assign', resourceA)).toBe(true);
    expect(can(admin, 'task.comment', resourceA)).toBe(true);
  });

  it('NO puede hacer acciones platform.*', () => {
    expect(can(admin, 'platform.businesses.list')).toBe(false);
    expect(can(admin, 'platform.metrics.read')).toBe(false);
    expect(can(admin, 'platform.impersonate')).toBe(false);
  });

  it('es rechazado en recurso de otro negocio', () => {
    expect(can(admin, 'task.read', resourceB)).toBe(false);
    expect(can(admin, 'business.settings.update', resourceB)).toBe(false);
  });
});

// ─── responsable ─────────────────────────────────────────────────────────────

describe('can() — responsable', () => {
  it('puede task.update.any', () => {
    expect(can(responsable, 'task.update.any', resourceA)).toBe(true);
  });

  it('NO puede business.settings.update', () => {
    expect(can(responsable, 'business.settings.update', resourceA)).toBe(false);
  });

  it('NO puede acciones platform.*', () => {
    expect(can(responsable, 'platform.businesses.list')).toBe(false);
  });

  it('puede leer reportes', () => {
    expect(can(responsable, 'business.reports.read', resourceA)).toBe(true);
  });
});

// ─── miembro ─────────────────────────────────────────────────────────────────

describe('can() — miembro', () => {
  it('puede task.update.assigned solo si está en assigneeIds', () => {
    const resource = { businessId: 'biz-A', assigneeIds: ['mem-1'] };
    expect(can(miembro, 'task.update.assigned', resource)).toBe(true);
  });

  it('NO puede task.update.assigned si no está en assigneeIds ni es creador', () => {
    const resource = { businessId: 'biz-A', assigneeIds: ['otro-user'], creatorId: 'otro-user' };
    expect(can(miembro, 'task.update.assigned', resource)).toBe(false);
  });

  it('puede task.update.assigned si es creador aunque no esté asignado', () => {
    const resource = { businessId: 'biz-A', assigneeIds: [], creatorId: 'mem-1' };
    expect(can(miembro, 'task.update.assigned', resource)).toBe(true);
  });

  it('puede comentar y leer tareas', () => {
    expect(can(miembro, 'task.read', resourceA)).toBe(true);
    expect(can(miembro, 'task.comment', resourceA)).toBe(true);
  });

  it('NO puede crear, eliminar ni asignar tareas', () => {
    expect(can(miembro, 'task.create', resourceA)).toBe(false);
    expect(can(miembro, 'task.delete', resourceA)).toBe(false);
    expect(can(miembro, 'task.assign', resourceA)).toBe(false);
  });
});

// ─── viewer ──────────────────────────────────────────────────────────────────

describe('can() — viewer', () => {
  it('solo puede task.read y business.reports.read', () => {
    expect(can(viewer, 'task.read', resourceA)).toBe(true);
    expect(can(viewer, 'business.reports.read', resourceA)).toBe(true);
  });

  it('NO puede crear, modificar ni comentar', () => {
    expect(can(viewer, 'task.create', resourceA)).toBe(false);
    expect(can(viewer, 'task.comment', resourceA)).toBe(false);
    expect(can(viewer, 'task.update.any', resourceA)).toBe(false);
    expect(can(viewer, 'task.delete', resourceA)).toBe(false);
  });
});

// ─── tenant isolation ─────────────────────────────────────────────────────────

describe('tenant isolation', () => {
  it('admin de biz-A rechazado en recurso de biz-B', () => {
    expect(can(admin, 'task.read', resourceB)).toBe(false);
    expect(can(admin, 'task.create', resourceB)).toBe(false);
    expect(can(admin, 'business.settings.update', resourceB)).toBe(false);
  });

  it('responsable de biz-A rechazado en recurso de biz-B', () => {
    expect(can(responsable, 'task.update.any', resourceB)).toBe(false);
  });

  it('null user siempre retorna false', () => {
    expect(can(null, 'task.read')).toBe(false);
    expect(can(undefined, 'task.read')).toBe(false);
  });
});

// ─── checkGranular (customRole override) ─────────────────────────────────────

describe('checkGranular — customRole deshabilita permisos', () => {
  const customPerms: PermissionSet = {
    ...EMPTY_PERMISSIONS,
    tasks: { read: true, create: true, update: true, delete: true, assign: true, comment: false },
    attachments: { upload: true, delete: false },
    reports: { read: true, export: false },
  };

  it('miembro con customRole que deshabilita task.comment no puede comentar', () => {
    expect(can(miembro, 'task.comment', resourceA, customPerms)).toBe(false);
  });

  it('miembro con customRole que permite task.read puede leer', () => {
    expect(can(miembro, 'task.read', resourceA, customPerms)).toBe(true);
  });

  it('admin ignora customPerms (siempre true)', () => {
    // admin bypasea checkGranular
    expect(can(admin, 'task.comment', resourceA, customPerms)).toBe(true);
  });

  it('superadmin ignora customPerms (siempre true)', () => {
    expect(can(superadmin, 'task.read', resourceA, customPerms)).toBe(true);
  });
});
