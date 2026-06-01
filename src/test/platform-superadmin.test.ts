import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isPlatformSuperAdminEmail,
  isPlatformSuperAdmin,
  cachedUserRoleForBusiness,
  isBusinessMemberRole,
} from '@/lib/platform-superadmin';

describe('platform-superadmin', () => {
  beforeEach(() => {
    vi.stubEnv('SUPERADMIN_EMAILS', 'tecnofusion.it@gmail.com,superadmin@test.com');
  });

  it('detecta email en SUPERADMIN_EMAILS', () => {
    expect(isPlatformSuperAdminEmail('tecnofusion.it@gmail.com')).toBe(true);
    expect(isPlatformSuperAdminEmail('  superadmin@test.com ')).toBe(true);
    expect(isPlatformSuperAdminEmail('other@test.com')).toBe(false);
  });

  it('isPlatformSuperAdmin por email o rol persistido', () => {
    expect(isPlatformSuperAdmin({ email: 'tecnofusion.it@gmail.com', role: 'admin' })).toBe(true);
    expect(isPlatformSuperAdmin({ email: 'x@test.com', role: 'superadmin' })).toBe(true);
    expect(isPlatformSuperAdmin({ email: 'x@test.com', role: 'admin' })).toBe(false);
  });

  it('cachedUserRoleForBusiness mantiene superadmin en User.role', () => {
    expect(
      cachedUserRoleForBusiness('tecnofusion.it@gmail.com', 'superadmin', 'admin')
    ).toBe('superadmin');
    expect(cachedUserRoleForBusiness('user@test.com', 'admin', 'miembro')).toBe('miembro');
  });

  it('isBusinessMemberRole rechaza superadmin en membresía', () => {
    expect(isBusinessMemberRole('admin')).toBe(true);
    expect(isBusinessMemberRole('superadmin')).toBe(false);
  });
});
