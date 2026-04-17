import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAdminDb } from '@/lib/firebase/admin';
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

  const db = getAdminDb();
  const snap = await db.collection('users').doc(decoded.uid).get();
  if (!snap.exists) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  const data = snap.data() as User;

  return {
    uid: decoded.uid,
    role: (decoded.role as UserRole) ?? data.role,
    businessId: (decoded.businessId as string | undefined) ?? data.businessId,
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
