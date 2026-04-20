import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
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

  const targetBusinessId =
    authed.role === 'superadmin' ? businessId ?? authed.businessId : authed.businessId;

  if (authed.role === 'admin' && !targetBusinessId) {
    console.error('User create error: Admin trying to create user without businessId context');
    return NextResponse.json({ error: 'business_id_required' }, { status: 400 });
  }

  if (authed.role === 'admin' && (role === 'admin' || role === 'superadmin')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Check email in PostgreSQL
  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing) {
    return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
  }

  const adminAuth = getAdminAuth();
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
    const error = err as { code?: string; message?: string };
    console.error('Firebase Auth creation failed:', error.code, error.message);
    
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
    }
    return NextResponse.json({ 
      error: 'auth_creation_failed', 
      details: error.message 
    }, { status: 500 });
  }

  try {
    await prisma.user.create({
      data: {
        id: uid,
        name: name.trim(),
        email: email.trim(),
        role,
        businessId: targetBusinessId ?? null,
        preferences: DEFAULT_PREFERENCES,
        isActive: true,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Prisma DB write failed:', error.message);
    await adminAuth.deleteUser(uid).catch(() => {});
    return NextResponse.json({ 
      error: 'db_write_failed',
      details: error.message 
    }, { status: 500 });
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { role, businessId: targetBusinessId ?? null });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Failed to set custom claims:', error.message);
    // No borramos el usuario porque el registro ya está en Auth y DB,
    // pero el admin debería saber que hubo un problema parcial.
  }

  return NextResponse.json(
    { uid, name: name.trim(), email: email.trim(), role, businessId: targetBusinessId },
    { status: 201 }
  );
}
