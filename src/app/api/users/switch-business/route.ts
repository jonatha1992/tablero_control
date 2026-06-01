import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';
import { cachedUserRoleForBusiness } from '@/lib/platform-superadmin';
import type { UserRole } from '@/types/domain/user';

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const body = await request.json() as { businessId?: string };
  const targetBusinessId = body.businessId;

  if (!targetBusinessId) {
    return NextResponse.json({ error: 'businessId_required' }, { status: 400 });
  }

  const membership = await prisma.userBusiness.findUnique({
    where: { userId_businessId: { userId: user.uid, businessId: targetBusinessId } },
  });

  if (!membership || !membership.isActive) {
    return NextResponse.json({ error: 'not_a_member' }, { status: 403 });
  }

  const membershipRole =
    membership.role === 'superadmin' ? 'admin' : (membership.role as UserRole);
  const cachedRole = cachedUserRoleForBusiness(
    user.email ?? user.data.email,
    user.data.role,
    membershipRole
  );

  const updated = await prisma.user.update({
    where: { id: user.uid },
    data: {
      businessId: membership.businessId,
      role: cachedRole,
      locationId: membership.locationId,
      customRoleIds: [],
    },
    include: { teams: true, memberships: true },
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: updated.role,
    businessId: membership.businessId,
    action: 'user.switch_business',
    targetType: 'USER',
    targetId: user.uid,
    metadata: { fromBusinessId: user.businessId, toBusinessId: membership.businessId },
  });

  return NextResponse.json(updated);
});
