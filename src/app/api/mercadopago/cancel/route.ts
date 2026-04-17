import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { cancelPreapproval } from '@/lib/mercadopago/preapproval';
import { getAdminDb } from '@/lib/firebase/admin';
import { writeAuditLog } from '@/lib/api/audit';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['admin', 'superadmin']);
  if (denied) return denied;

  const { subscriptionId } = await req.json() as { subscriptionId?: string };
  if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 });

  const db = getAdminDb();
  const snap = await db.collection('subscriptions').doc(subscriptionId).get();
  if (!snap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const sub = snap.data()!;
  if (user.role === 'admin' && user.businessId !== sub.businessId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (sub.mpPreapprovalId) {
    await cancelPreapproval(sub.mpPreapprovalId as string);
  }

  const now = Timestamp.now();
  await snap.ref.update({ status: 'cancelled', cancelAtPeriodEnd: false, updatedAt: now });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: sub.businessId as string,
    action: 'subscription.cancel',
    targetType: 'subscription',
    targetId: subscriptionId,
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
