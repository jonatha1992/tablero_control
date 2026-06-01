import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { prisma } from '@/lib/prisma';
import type { User, UserRole } from '@/types/domain/user';
import {
  cachedUserRoleForBusiness,
  isPlatformSuperAdmin,
  isPlatformSuperAdminEmail,
} from '@/lib/platform-superadmin';

export interface AuthedUser {
  uid: string;
  role: UserRole;
  businessId?: string;
  businessStatus?: string;
  email?: string;
  data: User;
}

export async function requireUser(req: NextRequest): Promise<AuthedUser | NextResponse> {
  const authz = req.headers.get('authorization');
  if (!authz?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }
  const token = authz.slice(7);
  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  const row = await prisma.user.findUnique({
    where: { id: decoded.uid },
    include: {
      teams: true,
      memberships: {
        include: { business: { select: { name: true } } },
      },
    },
  });
  if (!row) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  const memberships = row.memberships ?? [];
  const platformSuperAdmin = isPlatformSuperAdmin({ email: row.email, role: row.role as UserRole });
  let businessRole = row.role as UserRole;
  let effectiveRole = platformSuperAdmin ? ('superadmin' as UserRole) : businessRole;
  let effectiveBusinessId = row.businessId ?? undefined;

  // Resolve business membership role (never overwrites platform superadmin)
  if (effectiveBusinessId) {
    const activeMembership = memberships.find(
      (m) => m.businessId === effectiveBusinessId && m.isActive
    );
    if (activeMembership) {
      businessRole =
        activeMembership.role === 'superadmin' ? 'admin' : (activeMembership.role as UserRole);
      effectiveRole = platformSuperAdmin ? 'superadmin' : businessRole;
    } else {
      // No active membership for cached businessId → fallback to another active membership
      const fallback = memberships.find((m) => m.isActive);
      if (fallback) {
        effectiveBusinessId = fallback.businessId;
        businessRole =
          fallback.role === 'superadmin' ? 'admin' : (fallback.role as UserRole);
        effectiveRole = platformSuperAdmin ? 'superadmin' : businessRole;
        const cachedRole = cachedUserRoleForBusiness(
          row.email,
          row.role as UserRole,
          businessRole
        );
        prisma.user.update({
          where: { id: row.id },
          data: { businessId: fallback.businessId, role: cachedRole },
        }).catch(() => { /* ignore */ });
      } else {
        effectiveBusinessId = undefined;
      }
    }
  }

  const data: User = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: effectiveRole,
    businessRole: platformSuperAdmin ? businessRole : undefined,
    isPlatformSuperAdmin: platformSuperAdmin,
    businessId: effectiveBusinessId,
    locationId: row.locationId ?? undefined,
    customRoleIds: row.customRoleIds ?? [],
    avatar: row.avatar ?? undefined,
    phone: row.phone ?? undefined,
    teamIds: row.teams.map((t) => t.teamId),
    memberships: memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      businessId: m.businessId,
      role: m.role as UserRole,
      locationId: m.locationId ?? undefined,
      businessName: (m as unknown as { business?: { name: string } }).business?.name,
      isActive: m.isActive,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
    preferences: row.preferences as unknown as User['preferences'],
    isActive: row.isActive,
    lastLogin: row.lastLogin ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  let businessStatus: string | undefined;
  if (effectiveBusinessId) {
    const biz = await prisma.business.findUnique({
      where: { id: effectiveBusinessId },
      select: { status: true },
    });
    businessStatus = biz?.status ?? undefined;
  }

  return {
    uid: decoded.uid,
    role: effectiveRole,
    businessId: effectiveBusinessId,
    businessStatus,
    email: decoded.email,
    data,
  };
}

export function requireActiveSubscription(user: AuthedUser, req: NextRequest): NextResponse | null {
  if (user.role === 'superadmin') return null;
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return null;
  if (user.businessStatus === 'suspended') {
    return NextResponse.json(
      { error: 'subscription_required', detail: 'Suscripción vencida. Renovar en /dashboard/billing' },
      { status: 403 }
    );
  }
  return null;
}

export function requireRole(user: AuthedUser, roles: UserRole[]): NextResponse | null {
  const allowed =
    roles.includes(user.role) ||
    (roles.includes('superadmin') && isPlatformSuperAdminEmail(user.email));
  if (!allowed) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return null;
}
