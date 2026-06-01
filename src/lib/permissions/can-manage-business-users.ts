import type { User } from '@/types/domain/user';
import { can } from './matrix';

/** Admin/superadmin roles, or the business owner (space creator), may manage team members. */
export function canManageBusinessUsers(
  user: Pick<User, 'id' | 'role' | 'businessId'>,
  businessOwnerId?: string | null
): boolean {
  if (can(user, 'business.users.crud')) return true;
  return Boolean(
    user.businessId &&
    businessOwnerId &&
    user.id === businessOwnerId
  );
}
