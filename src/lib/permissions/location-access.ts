import type { User } from '@/types/domain/user';
import { can } from './matrix';

export type LocationMutation = 'create' | 'update' | 'delete';

export interface LocationResource {
  id: string;
  businessId: string;
  managerId?: string | null;
}

/** Whether the user may create, update, or delete a location in the active espacio. */
export function canMutateLocation(
  user: Pick<User, 'id' | 'role' | 'businessId' | 'memberships'>,
  action: LocationMutation,
  location?: LocationResource,
): boolean {
  const resourceBusinessId = location?.businessId ?? user.businessId;
  const resource = resourceBusinessId ? { businessId: resourceBusinessId } : undefined;

  if (can(user, 'business.locations.crud', resource)) {
    return true;
  }

  // Superadmin operando dentro de un espacio (business switcher)
  if (
    user.role === 'superadmin' &&
    user.businessId &&
    (!location || location.businessId === user.businessId)
  ) {
    return true;
  }

  // Responsable: puede editar su sede asignada
  if (action === 'update' && location && user.role === 'responsable') {
    const membership = user.memberships?.find(
      (m) => m.businessId === location.businessId && m.isActive,
    );
    if (membership?.locationId === location.id) return true;
    if (location.managerId && location.managerId === user.id) return true;
  }

  return false;
}
