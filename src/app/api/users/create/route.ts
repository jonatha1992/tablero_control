import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';
import { MailService } from '@/services/mail.service';
import { handle } from '@/lib/api/route-handler';
import type { UserRole } from '@/types/domain/user';

export type CreateUserMode = 'email' | 'username' | 'google' | 'ghost';

export interface CreateUserBody {
  name: string;
<<<<<<< HEAD
  email?: string;
  username?: string;
  password?: string;
  mode?: CreateUserMode;
=======
  email: string;
  password?: string;
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
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

export const POST = handle(async (req: NextRequest) => {
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

<<<<<<< HEAD
  const { name, role, businessId, locationId } = body;
  const mode: CreateUserMode = body.mode ?? 'email';
  const email = body.email?.toLowerCase().trim() ?? '';
  const username = body.username?.toLowerCase().trim() ?? '';

  if (!name?.trim() || !role) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (mode === 'email' && (!email || !body.password)) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (mode === 'username' && (!username || !body.password)) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (mode === 'google' && !email) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const isGhost = mode === 'ghost';
  const syntheticEmail = mode === 'username' ? `${username}@tablero.local` : isGhost ? `ghost-${crypto.randomUUID()}@tablero.local` : '';
  const firebaseEmail = (mode === 'username' || isGhost) ? syntheticEmail : email;
  const isSyntheticEmail = firebaseEmail.endsWith('@tablero.local');
  const password = body.password ?? '';
=======
  const { name, password, role, businessId, locationId } = body;
  const email = body.email?.toLowerCase().trim() ?? '';

  if (!name?.trim() || !email || !role) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (password !== undefined && password.length < 6) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 400 });
  }
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb

  const targetBusinessId =
    authed.role === 'superadmin' ? businessId ?? authed.businessId : authed.businessId;

  if (authed.role === 'admin' && (role === 'admin' || role === 'superadmin')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Enforce plan user limit (skip for superadmin)
  if (authed.role !== 'superadmin' && targetBusinessId) {
    try {
      const business = await prisma.business.findUnique({
        where: { id: targetBusinessId },
        select: { plan: true },
      });
      if (business) {
        const planConfig = await getEffectivePlanConfig(business.plan);
        const limit = planConfig.limits.users;
        if (limit !== -1) {
          const current = await prisma.userBusiness.count({
            where: { businessId: targetBusinessId, isActive: true },
          });
          if (current >= limit) {
            return NextResponse.json(
              { error: 'members_limit_exceeded', limit, current },
              { status: 429 }
            );
          }
        }
      }
    } catch {
      return NextResponse.json({ error: 'plan_check_failed' }, { status: 500 });
    }
  }

<<<<<<< HEAD
  // Check username uniqueness for username mode
  if (mode === 'username') {
    try {
      const existingByUsername = await prisma.user.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } },
      });
      if (existingByUsername) {
        return NextResponse.json({ error: 'username_already_exists' }, { status: 409 });
      }
    } catch {
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
  }

  // Check email in PostgreSQL (for email and google modes)
  if (mode !== 'username' && !isGhost) {
    let existing;
    try {
      existing = await prisma.user.findFirst({
        where: { email: { equals: firebaseEmail, mode: 'insensitive' } },
      });
    } catch {
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
    if (existing) {
      if (!existing.isActive && existing.businessId === targetBusinessId) {
        return NextResponse.json(
          { error: 'email_inactive', userId: existing.id },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
=======
  // Check email in PostgreSQL
  let existing;
  try {
    existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  } catch {
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
  if (existing) {
    if (!existing.isActive && existing.businessId === targetBusinessId) {
      return NextResponse.json(
        { error: 'email_inactive', userId: existing.id },
        { status: 409 }
      );
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    }
  }

  const adminAuth = getAdminAuth();
  let uid: string;
<<<<<<< HEAD
  
  if (isGhost) {
    uid = crypto.randomUUID();
  } else {
    try {
      const authUser = await adminAuth.createUser({
        email: firebaseEmail,
        ...(password ? { password } : {}),
        displayName: name.trim(),
        emailVerified: mode !== 'google',
      });
      uid = authUser.uid;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'auth_creation_failed' }, { status: 500 });
=======
  try {
    const authUser = await adminAuth.createUser({
      email,
      ...(password !== undefined && { password }),
      displayName: name.trim(),
      emailVerified: true,
    });
    uid = authUser.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    }
  }

  try {
    await prisma.user.create({
      data: {
        id: uid,
        name: name.trim(),
<<<<<<< HEAD
        email: firebaseEmail,
        username: mode === 'username' ? username : undefined,
=======
        email,
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
        role,
        businessId: targetBusinessId ?? null,
        locationId: locationId ?? null,
        preferences: DEFAULT_PREFERENCES,
        isActive: true,
        isGuest: isGhost,
      },
    });
    if (targetBusinessId) {
      await prisma.userBusiness.create({
        data: {
          userId: uid,
          businessId: targetBusinessId,
          role,
          locationId: locationId ?? null,
          isActive: true,
        },
      });
    }
  } catch {
    await adminAuth.deleteUser(uid).catch(() => { });
    return NextResponse.json({ error: 'db_write_failed' }, { status: 500 });
  }

<<<<<<< HEAD
  if (!isGhost) {
    try {
      await adminAuth.setCustomUserClaims(uid, { role, businessId: targetBusinessId ?? null });
    } catch (err) {
      console.error('[create-user] setCustomUserClaims failed (non-fatal):', err);
    }
=======
  try {
    await adminAuth.setCustomUserClaims(uid, { role, businessId: targetBusinessId ?? null });
  } catch (err) {
    console.error('[create-user] setCustomUserClaims failed (non-fatal):', err);
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
  }

  await writeAuditLog({
    actorId: authed.uid,
    actorRole: authed.role,
    businessId: authed.businessId,
    action: 'user.create',
    targetType: 'USER',
    targetId: uid,
    metadata: { email: isSyntheticEmail ? undefined : firebaseEmail, username: mode === 'username' ? username : undefined, mode, role, locationId },
  });

<<<<<<< HEAD
  if (targetBusinessId && !isSyntheticEmail && mode !== 'google') {
    prisma.business.findUnique({ where: { id: targetBusinessId }, select: { name: true } })
      .then((biz) => {
        const teamName = biz?.name ?? 'el equipo';
        const inviterName = authed.data.name ?? authed.data.email ?? 'Un administrador';
        const inviterEmail = authed.data.email;
        MailService.sendInviteEmail(firebaseEmail, inviterName, teamName, inviterEmail).catch(() => { });
=======
  if (targetBusinessId) {
    prisma.business.findUnique({ where: { id: targetBusinessId }, select: { name: true } })
      .then(async (biz) => {
        const teamName = biz?.name ?? 'el equipo';
        const inviterName = authed.data.name ?? authed.data.email ?? 'Un administrador';
        const inviterEmail = authed.data.email;
        const resetLink = password
          ? undefined
          : await adminAuth.generatePasswordResetLink(email).catch(() => undefined);
        MailService.sendInviteEmail(email, inviterName, teamName, inviterEmail, resetLink).catch(() => { });
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
      })
      .catch(() => { });
  }

  return NextResponse.json(
<<<<<<< HEAD
    {
      uid,
      name: name.trim(),
      email: isSyntheticEmail ? undefined : firebaseEmail,
      username: mode === 'username' ? username : undefined,
      mode,
      role,
      businessId: targetBusinessId,
    },
=======
    { uid, name: name.trim(), email, role, businessId: targetBusinessId },
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    { status: 201 }
  );
});
