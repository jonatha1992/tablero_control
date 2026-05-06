import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';
import { MailService } from '@/services/mail.service';
import { handle } from '@/lib/api/route-handler';
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

  const { name, password, role, businessId, locationId } = body;
  const email = body.email?.toLowerCase().trim() ?? '';

  if (!name?.trim() || !email || !password || !role) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

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
    }
    return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
  }

  const adminAuth = getAdminAuth();
  let uid: string;
  try {
    const authUser = await adminAuth.createUser({
      email,
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
        email,
        role,
        businessId: targetBusinessId ?? null,
        locationId: locationId ?? null,
        preferences: DEFAULT_PREFERENCES,
        isActive: true,
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

  try {
    await adminAuth.setCustomUserClaims(uid, { role, businessId: targetBusinessId ?? null });
  } catch (err) {
    console.error('[create-user] setCustomUserClaims failed (non-fatal):', err);
  }

  await writeAuditLog({
    actorId: authed.uid,
    actorRole: authed.role,
    businessId: authed.businessId,
    action: 'user.create',
    targetType: 'USER',
    targetId: uid,
    metadata: { email, role, locationId },
  });

  if (targetBusinessId) {
    prisma.business.findUnique({ where: { id: targetBusinessId }, select: { name: true } })
      .then((biz) => {
        const teamName = biz?.name ?? 'el equipo';
        const inviterName = authed.data.name ?? authed.data.email ?? 'Un administrador';
        const inviterEmail = authed.data.email;
        MailService.sendInviteEmail(email, inviterName, teamName, inviterEmail).catch(() => { });
      })
      .catch(() => { });
  }

  return NextResponse.json(
    { uid, name: name.trim(), email, role, businessId: targetBusinessId },
    { status: 201 }
  );
});
