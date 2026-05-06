import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';

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

  const updated = await prisma.user.update({
    where: { id: user.uid },
    data: {
      businessId: membership.businessId,
      role: membership.role,
      locationId: membership.locationId,
    },
    include: { teams: true, memberships: true },
  });

  return NextResponse.json(updated);
});
