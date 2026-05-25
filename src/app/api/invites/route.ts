import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';

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

  let body: {
    businessId: string;
    role?: string;
    locationIds?: string[];
    maxUses?: number;
    expiresInDays?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { businessId, locationIds = [], maxUses = 0, expiresInDays = 7, role: bodyRole } = body;
  if (!businessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }

  const validRoles: UserRole[] = ['miembro', 'responsable', 'viewer', 'admin', 'pending'];
  const inviteRole: UserRole = validRoles.includes(bodyRole as UserRole) ? (bodyRole as UserRole) : 'miembro';

  assertSameTenant(user.data, { businessId });

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
    metadata: { role: inviteRole, maxUses, expiresInDays },
  });

  const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/i/${invite.id}`;

  return NextResponse.json({ ...invite, link }, { status: 201 });
});
