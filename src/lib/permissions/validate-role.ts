import type { CustomRole, PermissionSet } from '@/types/domain/custom-role';
import type { PlanId } from '@/types/domain/subscription';

export interface RoleValidationError {
  field: string;
  message: string;
}

const FORBIDDEN_FOR_CUSTOM: Array<keyof PermissionSet> = ['billing'];

const PLAN_ALLOWS_REPORTS_EXPORT: Record<PlanId, boolean> = {
  free: false,
  basic: false,
  pro: true,
  enterprise: true,
};

export function validateCustomRole(
  role: Pick<CustomRole, 'name' | 'slug' | 'permissions' | 'baseRole' | 'color'>,
  plan: PlanId
): RoleValidationError[] {
  const errors: RoleValidationError[] = [];

  if (!role.name || role.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'El nombre debe tener al menos 2 caracteres' });
  }
  if (!/^[a-z0-9_]+$/.test(role.slug)) {
    errors.push({ field: 'slug', message: 'El slug solo admite minúsculas, números y guion bajo' });
  }
  if (!/^#[0-9a-f]{6}$/i.test(role.color)) {
    errors.push({ field: 'color', message: 'Color inválido (formato #rrggbb)' });
  }

  // Un rol custom nunca puede otorgar permisos de facturación
  if (role.permissions.billing.manage || role.permissions.billing.read) {
    errors.push({ field: 'permissions.billing', message: 'No se pueden otorgar permisos de facturación a roles custom' });
  }

  // Export de reportes limitado por plan
  if (role.permissions.reports.export && !PLAN_ALLOWS_REPORTS_EXPORT[plan]) {
    errors.push({ field: 'permissions.reports.export', message: 'El plan actual no permite exportar reportes' });
  }

  // changeRole reservado al admin base
  if (role.permissions.users.changeRole) {
    errors.push({ field: 'permissions.users.changeRole', message: 'Solo los administradores pueden cambiar roles' });
  }

  return errors;
}

export function isCustomRoleValid(role: Pick<CustomRole, 'name' | 'slug' | 'permissions' | 'baseRole' | 'color'>, plan: PlanId): boolean {
  return validateCustomRole(role, plan).length === 0;
}

export { FORBIDDEN_FOR_CUSTOM };
