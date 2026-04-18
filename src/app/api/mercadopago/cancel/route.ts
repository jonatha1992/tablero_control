export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { cancelPreapproval } from '@/lib/mercadopago/preapproval';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['admin', 'superadmin']);
  if (denied) return denied;

  const { subscriptionId } = await req.json() as { subscriptionId?: string };
  if (!subscriptionId) {
    return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (user.role === 'admin' && user.businessId !== sub.businessId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (sub.mpPreapprovalId) {
    await cancelPreapproval(sub.mpPreapprovalId);
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'cancelled', cancelAtPeriodEnd: false },
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: sub.businessId,
    action: 'subscription.cancel',
    targetType: 'subscription',
    targetId: subscriptionId,
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
