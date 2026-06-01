import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';
import { sendNotification } from '@/lib/notifications';
import { isValidUsername } from '@/lib/auth/invite-username';
import {
  inviteErrorCode,
  inviteErrorStatus,
  validateInvite,
} from '@/lib/invites/validate-invite';

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ token: string }> }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let decoded: Awaited<ReturnType<typeof verifyToken>>;
  try {
    decoded = await verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let acceptBody: { username?: string } = {};
  try {
    const raw = await request.text();
    if (raw.trim()) {
      acceptBody = JSON.parse(raw) as { username?: string };
    }
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const requestedUsername = acceptBody.username?.toLowerCase().trim() ?? '';
  if (requestedUsername && !isValidUsername(requestedUsername)) {
    return NextResponse.json({ error: 'invalid_username' }, { status: 400 });
  }

  const { token: inviteToken } = await params;

  const invite = await prisma.businessInvite.findUnique({
    where: { id: inviteToken },
    include: { business: { select: { plan: true, name: true } } },
  });

  const validation = validateInvite(invite);
  if (!validation.valid) {
    return NextResponse.json(
      { error: inviteErrorCode(validation.reason) },
      { status: inviteErrorStatus(validation.reason) },
    );
  }

  const activeInvite = invite!;

  let user = await prisma.user.findUnique({
    where: { id: decoded.uid },
  });

  // Caso edge: usuario invitado por email tiene UUID viejo en lugar del UID de Firebase.
  // Intentar match por email y actualizar el ID.
  if (!user && decoded.email) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: decoded.email.toLowerCase().trim(), mode: 'insensitive' } },
    });
    if (byEmail) {
      try {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: { id: decoded.uid },
        });
      } catch {
        // Fallback: usar el registro existente sin actualizar ID
        user = byEmail;
      }
    }
  }

  // Si todavía no existe, crearlo sin negocio propio (solo membresía al aceptar)
  if (!user && decoded.email) {
    if (requestedUsername) {
      const usernameTaken = await prisma.user.findFirst({
        where: { username: { equals: requestedUsername, mode: 'insensitive' } },
        select: { id: true },
      });
      if (usernameTaken) {
        return NextResponse.json({ error: 'username_already_exists' }, { status: 409 });
      }
    }

    user = await prisma.user.create({
      data: {
        id: decoded.uid,
        email: decoded.email.toLowerCase().trim(),
        name: decoded.name || decoded.email.split('@')[0] || 'Usuario',
        username: requestedUsername || undefined,
        role: 'pending',
        preferences: {
          theme: 'system',
          locale: 'es',
          timezone: 'America/Argentina/Buenos_Aires',
          notifications: { email: true, push: false, agentReports: false, agentAlerts: false },
          dashboardLayout: [],
          accountIntent: 'collaborator',
          joinedViaInviteAt: new Date().toISOString(),
        },
        isActive: true,
      },
    });
  }

  if (!user) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  }

  // Check existing membership
  const existingMembership = await prisma.userBusiness.findUnique({
    where: { userId_businessId: { userId: user.id, businessId: activeInvite.businessId } },
  });

  if (existingMembership) {
    if (existingMembership.isActive) {
      return NextResponse.json({ error: 'already_member' }, { status: 409 });
    }
  }

  // Plan limit check for both new and reactivated members
  const planConfig = await getEffectivePlanConfig(activeInvite.business.plan);
  const limit = planConfig.limits.users;
  if (limit !== -1) {
    const current = await prisma.userBusiness.count({
      where: { businessId: activeInvite.businessId, isActive: true },
    });
    if (current >= limit) {
      return NextResponse.json(
        { error: 'members_limit_exceeded', limit, current },
        { status: 429 }
      );
    }
  }

  if (existingMembership) {
    // Reactivate membership
    await prisma.userBusiness.update({
      where: { userId_businessId: { userId: user.id, businessId: activeInvite.businessId } },
      data: { isActive: true, role: activeInvite.role, locationId: activeInvite.locationIds[0] ?? null },
    });
  } else {
    // Create membership
    await prisma.userBusiness.create({
      data: {
        userId: user.id,
        businessId: activeInvite.businessId,
        role: activeInvite.role,
        locationId: activeInvite.locationIds[0] ?? null,
        isActive: true,
      },
    });
  }

  // Switch to invited business — but don't overwrite global role if user has higher role in another business
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { businessId: activeInvite.businessId, role: activeInvite.role, locationId: activeInvite.locationIds[0] ?? null, customRoleIds: [] },
  });

  await prisma.businessInvite.update({
    where: { id: inviteToken },
    data: { usedCount: { increment: 1 } },
  });

  await writeAuditLog({
    actorId: decoded.uid,
    actorRole: updatedUser.role,
    businessId: activeInvite.businessId,
    action: 'user.join_via_invite',
    targetType: 'USER',
    targetId: decoded.uid,
    metadata: { inviteId: inviteToken, role: activeInvite.role },
  });

  const joinerName = updatedUser.name ?? decoded.email ?? 'Un nuevo miembro';
  prisma.userBusiness.findMany({ where: { businessId: activeInvite.businessId, role: 'admin', isActive: true }, select: { userId: true } })
    .then((admins) => {
      for (const a of admins) {
        if (a.userId === decoded.uid) continue;
        sendNotification({ userId: a.userId, title: 'Nuevo miembro en el equipo', body: `${joinerName} se unió al equipo`, type: 'info', link: '/dashboard/equipo' }).catch(() => {});
      }
    }).catch(() => {});

  return NextResponse.json(updatedUser);
});
