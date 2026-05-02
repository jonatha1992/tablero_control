import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['admin', 'superadmin']);
  if (denied) return denied;

  const body = await req.json() as { businessId?: string };
  const businessId = user.role === 'superadmin' ? (body.businessId ?? user.businessId) : user.businessId;

  if (!businessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }
  if (user.role === 'admin' && user.businessId !== businessId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const sub = await prisma.subscription.findUnique({ where: { businessId } });
  if (!sub) return NextResponse.json({ error: 'no_subscription' }, { status: 404 });

  const now = new Date();
  let newStatus = sub.status;

  // Local period check — no MP API call needed for Checkout Pro
  if (sub.status === 'active' && sub.currentPeriodEnd && sub.currentPeriodEnd < now) {
    newStatus = 'past_due';
  } else if (sub.status === 'past_due' && sub.currentPeriodEnd && sub.currentPeriodEnd >= now) {
    // Shouldn't happen normally but defensive
    newStatus = 'active';
  }

  if (newStatus === sub.status) {
    return NextResponse.json({ status: newStatus, synced: false, reason: 'already_up_to_date' });
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: newStatus },
  });

  if (newStatus === 'past_due') {
    await prisma.business.update({
      where: { id: businessId },
      data: { status: 'suspended' },
    });
  }

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId,
    action: 'subscription.sync',
    targetType: 'subscription',
    targetId: sub.id,
    metadata: { previousStatus: sub.status, newStatus },
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ status: newStatus, synced: true });
});
