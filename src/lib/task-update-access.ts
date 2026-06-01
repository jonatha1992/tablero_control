import { can } from '@/lib/permissions';
import { getActiveMembershipLocationId } from '@/lib/task-delete-access';
import type { User } from '@/types/domain/user';

/** Mirrors PATCH /api/tasks/[id] permission + location checks (client-side). */
export function canUpdateTask(
  user: Pick<User, 'id' | 'role' | 'businessId' | 'memberships'> | null | undefined,
  task?: {
    locationId?: string | null;
    assigneeIds?: string[];
    creatorId?: string;
  },
): boolean {
  if (!user?.businessId || !task) return false;

  if (can(user, 'task.update.any')) {
    const userLocationId = getActiveMembershipLocationId(user);
    if (userLocationId && user.role !== 'admin' && user.role !== 'superadmin') {
      if (task.locationId && task.locationId !== userLocationId) {
        return false;
      }
    }
    return true;
  }

  if (
    !can(user, 'task.update.assigned', {
      assigneeIds: task.assigneeIds,
      creatorId: task.creatorId,
    })
  ) {
    return false;
  }

  const userLocationId = getActiveMembershipLocationId(user);
  if (userLocationId && user.role !== 'admin' && user.role !== 'superadmin') {
    if (task.locationId && task.locationId !== userLocationId) {
      return false;
    }
  }
  return true;
}

export function taskUpdateErrorMessage(reason?: string): string {
  switch (reason) {
    case 'missing_permission':
      return 'No tenés permisos para editar esta tarea. Tenés que estar asignado o haberla creado vos.';
    case 'wrong_location':
      return 'No podés editar tareas de otro sector.';
    case 'forbidden':
      return 'No podés editar esta tarea.';
    default:
      return 'No se pudo guardar la tarea.';
  }
}
