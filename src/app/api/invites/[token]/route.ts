import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';

function validateInvite(invite: import('@prisma/client').BusinessInvite | null) {
  if (!invite || !invite.isActive) {
    return { valid: false, reason: 'revoked' as const };
  }
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { valid: false, reason: 'expired' as const };
  }
  if (invite.maxUses > 0 && invite.usedCount >= invite.maxUses) {
    return { valid: false, reason: 'max_uses' as const };
  }
  return { valid: true as const };
}

export const GET = handle(async (_request: NextRequest, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;

  const invite = await prisma.businessInvite.findUnique({
    where: { id: token },
    include: { business: { select: { name: true } } },
  });

  const validation = validateInvite(invite);
  if (!validation.valid) {
    return NextResponse.json({ valid: false, reason: validation.reason });
  }

  const usesLeft = invite!.maxUses > 0 ? invite!.maxUses - invite!.usedCount : null;

  return NextResponse.json({
    valid: true,
    businessName: invite!.business.name,
    role: invite!.role,
    expiresAt: invite!.expiresAt,
    usesLeft,
  });
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ token: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['admin', 'superadmin']);
  if (denied) return denied;

  const { token } = await params;

  const invite = await prisma.businessInvite.findUnique({
    where: { id: token },
  });

  if (!invite) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  assertSameTenant(user.data, { businessId: invite.businessId });

  await prisma.businessInvite.update({
    where: { id: token },
    data: { isActive: false },
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: invite.businessId,
    action: 'invite_link.revoke',
    targetType: 'BUSINESS_INVITE',
    targetId: token,
  });

  return NextResponse.json({ success: true });
});
