import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { createPreapproval } from '@/lib/mercadopago/preapproval';
import { getAdminDb } from '@/lib/firebase/admin';
import { writeAuditLog } from '@/lib/api/audit';
import { Timestamp } from 'firebase-admin/firestore';
import type { BillingFrequency, PlanId, Subscription } from '@/types/domain/subscription';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['admin', 'superadmin']);
  if (denied) return denied;

  const body = await req.json() as { plan?: PlanId; frequency?: BillingFrequency; businessId?: string };
  const { plan, frequency = 'monthly', businessId } = body;

  if (!plan || !businessId) {
    return NextResponse.json({ error: 'plan y businessId requeridos' }, { status: 400 });
  }
  if (user.role === 'admin' && user.businessId !== businessId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const origin = req.headers.get('origin') ?? 'http://localhost:3000';
  const backUrl = `${origin}/dashboard/billing?status=success`;

  const preapproval = await createPreapproval({
    plan,
    frequency,
    payerEmail: user.email ?? '',
    businessId,
    backUrl,
  });

  const db = getAdminDb();
  const now = Timestamp.now();
  const subRef = db.collection('subscriptions').doc();
  const sub = {
    businessId,
    plan,
    status: 'pending',
    mpPreapprovalId: preapproval.id,
    amount: preapproval.auto_recurring?.transaction_amount ?? 0,
    currency: 'ARS',
    frequency,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };
  await subRef.set(sub);
  await db.collection('businesses').doc(businessId).update({ subscriptionId: subRef.id, updatedAt: now });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId,
    action: 'subscription.create',
    targetType: 'subscription',
    targetId: subRef.id,
    metadata: { plan, frequency },
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ subscriptionId: subRef.id, initPoint: preapproval.init_point });
}
