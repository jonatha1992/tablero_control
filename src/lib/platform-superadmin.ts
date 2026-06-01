import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/types/domain/user';

/** Business-scoped roles only (never assign `superadmin` on UserBusiness). */
export const BUSINESS_MEMBER_ROLES: UserRole[] = [
  'admin',
  'responsable',
  'miembro',
  'viewer',
];

export function getSuperadminEmails(): string[] {
  return (process.env.SUPERADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperadminEmails().includes(email.toLowerCase().trim());
}

/** Platform operator: env allowlist and/or persisted User.role = superadmin. */
export function isPlatformSuperAdmin(user: {
  email: string;
  role?: UserRole | string | null;
}): boolean {
  return isPlatformSuperAdminEmail(user.email) || user.role === 'superadmin';
}

export function isBusinessMemberRole(role: UserRole): boolean {
  return BUSINESS_MEMBER_ROLES.includes(role);
}

/**
 * Restores User.role = superadmin for allowlisted emails and normalizes
 * UserBusiness rows that incorrectly used role superadmin (legacy).
 */
export async function healPlatformSuperAdmin(userId: string, email: string): Promise<void> {
  if (!isPlatformSuperAdminEmail(email)) return;

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'superadmin' },
  });

  await prisma.userBusiness.updateMany({
    where: { userId, role: 'superadmin' },
    data: { role: 'admin' },
  });
}

/** Role written to User.role when switching active business (cache). */
export function cachedUserRoleForBusiness(
  email: string,
  persistedRole: UserRole,
  membershipRole: UserRole
): UserRole {
  if (isPlatformSuperAdminEmail(email) || persistedRole === 'superadmin') {
    return 'superadmin';
  }
  return membershipRole;
}
