import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/types/domain/user';

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  businessId?: string;
  locationId?: string;
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

  const { name, email, password, role, businessId, locationId } = body;

  if (!name?.trim() || !email?.trim() || !password || !role) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const targetBusinessId =
    authed.role === 'superadmin' ? businessId ?? authed.businessId : authed.businessId;

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
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'auth_creation_failed' }, { status: 500 });
  }

  try {
    await prisma.user.create({
      data: {
        id: uid,
        name: name.trim(),
        email: email.trim(),
        role,
        businessId: targetBusinessId ?? null,
        locationId: locationId ?? null,
        preferences: DEFAULT_PREFERENCES,
        isActive: true,
      },
    });
  } catch {
    await adminAuth.deleteUser(uid).catch(() => {});
    return NextResponse.json({ error: 'db_write_failed' }, { status: 500 });
  }

  await adminAuth.setCustomUserClaims(uid, { role, businessId: targetBusinessId ?? null });

  await writeAuditLog({
    actorId: authed.uid,
    actorRole: authed.role,
    businessId: authed.businessId,
    action: 'CREATE',
    targetType: 'USER',
    targetId: uid,
    metadata: { email, role, locationId },
  });

  return NextResponse.json(
    { uid, name: name.trim(), email: email.trim(), role, businessId: targetBusinessId },
    { status: 201 }
  );
}
