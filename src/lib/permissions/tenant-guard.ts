import type { User } from '@/types/domain/user';

export class TenantMismatchError extends Error {
  constructor(public expected?: string, public got?: string) {
    super(`Tenant mismatch: expected=${expected ?? 'n/a'} got=${got ?? 'n/a'}`);
    this.name = 'TenantMismatchError';
  }
}

export function assertSameTenant(
  user: Pick<User, 'role' | 'businessId'>,
  resource: { businessId?: string }
): void {
  if (user.role === 'superadmin') return;
  if (!user.businessId || !resource.businessId || user.businessId !== resource.businessId) {
    throw new TenantMismatchError(user.businessId, resource.businessId);
  }
}

export function isSameTenant(
  user: Pick<User, 'role' | 'businessId'>,
  resource: { businessId?: string }
): boolean {
  if (user.role === 'superadmin') return true;
  return Boolean(user.businessId && resource.businessId && user.businessId === resource.businessId);
}
