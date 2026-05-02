import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ businesses });
});

export const PATCH = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const { businessId, action } = await req.json() as { businessId?: string; action?: 'suspend' | 'reactivate' };
  if (!businessId || !action) {
    return NextResponse.json({ error: 'businessId y action requeridos' }, { status: 400 });
  }

  const status = action === 'suspend' ? 'suspended' : 'active';
  await prisma.business.update({
    where: { id: businessId },
    data: {
      status,
      suspendedAt: action === 'suspend' ? new Date() : null,
      suspendedReason: action === 'suspend' ? 'Suspendido por superadmin' : null,
    },
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    action: action === 'suspend' ? 'business.suspend' : 'business.reactivate',
    targetType: 'business',
    targetId: businessId,
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ ok: true });
});
