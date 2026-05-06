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
    include: { teams: true },
  });
  if (!row) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  const data: User = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    businessId: row.businessId ?? undefined,
    locationId: row.locationId ?? undefined,
    customRoleIds: row.customRoleIds ?? [],
    avatar: row.avatar ?? undefined,
    phone: row.phone ?? undefined,
    teamIds: row.teams.map((t) => t.teamId),
    preferences: row.preferences as unknown as User['preferences'],
    isActive: row.isActive,
    lastLogin: row.lastLogin ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  return {
    uid: decoded.uid,
    role: ((decoded.role as UserRole) ?? data.role),
    businessId: ((decoded.businessId as string | undefined) ?? data.businessId),
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
