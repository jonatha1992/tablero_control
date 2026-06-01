import { describe, it, expect } from 'vitest';
import { canManageBusinessUsers } from '@/lib/permissions/can-manage-business-users';

describe('canManageBusinessUsers', () => {
  it('allows admin role via permission matrix', () => {
    expect(
      canManageBusinessUsers(
        { id: 'adm-1', role: 'admin', businessId: 'biz-1' },
        'owner-1'
      )
    ).toBe(true);
  });

  it('allows business owner even when membership role is not admin', () => {
    expect(
      canManageBusinessUsers(
        { id: 'owner-1', role: 'miembro', businessId: 'biz-1' },
        'owner-1'
      )
    ).toBe(true);
  });

  it('denies non-admin non-owner', () => {
    expect(
      canManageBusinessUsers(
        { id: 'mem-1', role: 'miembro', businessId: 'biz-1' },
        'owner-1'
      )
    ).toBe(false);
  });
});
