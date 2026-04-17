import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import type { UserRole } from '@/types/domain/user';

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  businessId?: string;
}

export interface CreateUserResult {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string;
}

const DEFAULT_PREFERENCES = {
  theme: 'system' as const,
  locale: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  notifications: { email: true, push: false, agentReports: false, agentAlerts: false },
  dashboardLayout: [],
};

export async function POST(req: NextRequest) {
  const authed = await requireUser(req);
  if (authed instanceof NextResponse) return authed;

  const denied = requireRole(authed, ['superadmin', 'admin']);
  if (denied) return denied;

  let body: CreateUserBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { name, email, password, role, businessId } = body;

  if (!name?.trim() || !email?.trim() || !password || !role) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  // Admin can only create users in their own business
  const targetBusinessId =
    authed.role === 'superadmin' ? businessId ?? authed.businessId : authed.businessId;

  // Admin cannot create admins or superadmins
  if (authed.role === 'admin' && (role === 'admin' || role === 'superadmin')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminDb();

  // Check if email already exists in Firestore
  const existing = await db.collection('users').where('email', '==', email.trim()).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
  }

  let uid: string;
  try {
    const authUser = await adminAuth.createUser({
      email: email.trim(),
      password,
      displayName: name.trim(),
      emailVerified: true,
    });
    uid = authUser.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'auth_creation_failed' }, { status: 500 });
  }

  const now = new Date();
  const userDoc = {
    name: name.trim(),
    email: email.trim(),
    role,
    businessId: targetBusinessId ?? null,
    teamIds: [],
    preferences: DEFAULT_PREFERENCES,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.collection('users').doc(uid).set(userDoc);
  } catch {
    // Rollback Auth user if Firestore write fails
    await adminAuth.deleteUser(uid).catch(() => {});
    return NextResponse.json({ error: 'firestore_write_failed' }, { status: 500 });
  }

  // Set custom claims so role is available in the token
  await adminAuth.setCustomUserClaims(uid, { role, businessId: targetBusinessId ?? null });

  const result: CreateUserResult = {
    uid,
    name: name.trim(),
    email: email.trim(),
    role,
    businessId: targetBusinessId,
  };

  return NextResponse.json(result, { status: 201 });
}
