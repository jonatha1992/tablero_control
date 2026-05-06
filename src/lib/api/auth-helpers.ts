import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { prisma } from '@/lib/prisma';
import type { User, UserRole } from '@/types/domain/user';

export interface AuthedUser {
  uid: string;
  role: UserRole;
  businessId?: string;
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
  let effectiveRole = row.role as UserRole;
  let effectiveBusinessId = row.businessId ?? undefined;

  // Resolve effective role from active membership
  if (effectiveBusinessId) {
    const activeMembership = memberships.find(
      (m) => m.businessId === effectiveBusinessId && m.isActive
    );
    if (activeMembership) {
      effectiveRole = activeMembership.role as UserRole;
    } else {
      // No active membership for cached businessId → fallback to another active membership
      const fallback = memberships.find((m) => m.isActive);
      if (fallback) {
        effectiveBusinessId = fallback.businessId;
        effectiveRole = fallback.role as UserRole;
        // Update cache asynchronously (fire-and-forget)
        prisma.user.update({
          where: { id: row.id },
          data: { businessId: fallback.businessId, role: fallback.role },
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

  return {
    uid: decoded.uid,
    role: effectiveRole,
    businessId: effectiveBusinessId,
    email: decoded.email,
    data,
  };
}

export function requireRole(user: AuthedUser, roles: UserRole[]): NextResponse | null {
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return null;
}
