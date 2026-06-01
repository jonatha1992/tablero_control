import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { requireUser, requireRole, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';
import { MailService } from '@/services/mail.service';

export const GET = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['admin', 'superadmin']);
  if (denied) return denied;

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  if (!businessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }

  assertSameTenant(user.data, { businessId });

  const invites = await prisma.businessInvite.findMany({
    where: { businessId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invites);
});

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['admin', 'superadmin']);
  if (denied) return denied;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  let body: {
    businessId: string;
    role?: string;
    locationIds?: string[];
    maxUses?: number;
    expiresInDays?: number;
    email?: string;
    inviteeName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const {
    businessId,
    locationIds = [],
    maxUses: bodyMaxUses,
    expiresInDays = 7,
    role: bodyRole,
    email: bodyEmail,
    inviteeName,
  } = body;
  if (!businessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }

  const normalizedEmail = bodyEmail?.toLowerCase().trim() ?? '';
  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const validRoles: UserRole[] = ['miembro', 'responsable', 'viewer', 'admin', 'pending'];
  const inviteRole: UserRole = validRoles.includes(bodyRole as UserRole) ? (bodyRole as UserRole) : 'miembro';
  const maxUses = normalizedEmail ? 1 : Math.max(0, bodyMaxUses ?? 0);

  assertSameTenant(user.data, { businessId });

  if (normalizedEmail && user.role !== 'superadmin') {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { plan: true },
      });
      if (business) {
        const planConfig = await getEffectivePlanConfig(business.plan);
        const limit = planConfig.limits.users;
        if (limit !== -1) {
          const current = await prisma.userBusiness.count({
            where: { businessId, isActive: true },
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

  const expiresAt = expiresInDays > 0
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const invite = await prisma.businessInvite.create({
    data: {
      businessId,
      role: inviteRole,
      locationIds: Array.isArray(locationIds) ? locationIds : [],
      maxUses: Math.max(0, maxUses),
      expiresAt,
      createdBy: user.uid,
      isActive: true,
    },
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId,
    action: 'invite_link.create',
    targetType: 'BUSINESS_INVITE',
    targetId: invite.id,
    metadata: {
      role: inviteRole,
      maxUses,
      expiresInDays,
      ...(normalizedEmail ? { email: normalizedEmail, inviteeName: inviteeName?.trim() } : {}),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const link = `${appUrl}/i/${invite.id}`;

  let emailSent = false;
  if (normalizedEmail) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });
    const teamName = biz?.name ?? 'el equipo';
    const inviterName = user.data.name ?? user.data.email ?? 'Un administrador';
    const inviterEmail = user.data.email;
    const mail = await MailService.sendInviteEmail(
      normalizedEmail,
      inviterName,
      teamName,
      inviterEmail,
      undefined,
      link
    );
    emailSent = mail.success;
  }

  return NextResponse.json({ ...invite, link, emailSent }, { status: 201 });
});
