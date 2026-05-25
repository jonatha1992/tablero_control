import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { can } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  if (!can(user.data, 'business.users.crud')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  const { ids, locationId } = await request.json() as { ids: string[]; locationId: string | null };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  const targets = await prisma.userBusiness.findMany({
    where: { userId: { in: ids }, businessId: user.businessId },
    select: { userId: true, role: true },
  });

  if (targets.length !== ids.length) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.userBusiness.updateMany({
      where: { userId: { in: ids }, businessId: user.businessId },
      data: { locationId: locationId ?? null },
    }),
    prisma.user.updateMany({
      where: { id: { in: ids }, businessId: user.businessId },
      data: { locationId: locationId ?? null },
    }),
    prisma.userLocation.deleteMany({
      where: { userId: { in: ids }, location: { businessId: user.businessId } },
    }),
    ...(locationId
      ? [
          prisma.userLocation.createMany({
            data: targets.map((target) => ({
              userId: target.userId,
              locationId,
              role: target.role,
              customRoleIds: [],
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'user.update',
    targetType: 'USER',
    targetId: ids[0],
    metadata: { bulkIds: ids, locationId },
  });

  return NextResponse.json({ updated: ids.length });
});
