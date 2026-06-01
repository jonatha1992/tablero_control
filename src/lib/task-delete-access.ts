import { can } from '@/lib/permissions';
import type { User } from '@/types/domain/user';

export type TaskDeleteBlockReason =
  | 'missing_permission'
  | 'wrong_location'
  | 'no_business_context'
  | 'tenant_mismatch'
  | 'subscription_required';

export function getActiveMembershipLocationId(
  user: Pick<User, 'businessId' | 'memberships'> | null | undefined,
): string | undefined {
  if (!user?.businessId) return undefined;
  return user.memberships?.find((m) => m.businessId === user.businessId && m.isActive)?.locationId;
}

/** Mirrors DELETE /api/tasks/[id] location + permission checks (client-side). */
export function canDeleteTask(
  user: Pick<User, 'id' | 'role' | 'businessId' | 'memberships'> | null | undefined,
  task?: { locationId?: string | null },
): boolean {
  if (!user?.businessId) return false;
  if (!can(user, 'task.delete')) return false;

  const userLocationId = getActiveMembershipLocationId(user);
  if (userLocationId && user.role !== 'admin' && user.role !== 'superadmin') {
    if (task?.locationId && task.locationId !== userLocationId) {
      return false;
    }
  }
  return true;
}

export function taskDeleteErrorMessage(reason?: string): string {
  switch (reason) {
    case 'missing_permission':
      return 'No tenés permisos para eliminar tareas. Pedí a un admin que te asigne rol responsable.';
    case 'wrong_location':
      return 'No podés eliminar tareas de otro sector.';
    case 'no_business_context':
      return 'No hay un negocio activo en tu sesión.';
    case 'tenant_mismatch':
      return 'Esta tarea no pertenece a tu negocio.';
    case 'subscription_required':
      return 'La suscripción está vencida. Renová en Facturación.';
    default:
      return 'No tenés permisos para eliminar esta tarea.';
  }
}
