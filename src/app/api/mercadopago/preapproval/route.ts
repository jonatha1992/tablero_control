import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { createPreapproval } from '@/lib/mercadopago/preapproval';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';
import type { BillingFrequency, PlanId } from '@/types/domain/subscription';

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

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get('origin') ?? 'http://localhost:3000';
  const backUrl = `${origin}/dashboard/billing?status=pending`;

  if (!user.email) {
    return NextResponse.json({ error: 'user_email_required' }, { status: 400 });
  }

  const preapproval = await createPreapproval({
    plan,
    frequency,
    payerEmail: user.email,
    businessId,
    backUrl,
  });

  const sub = await prisma.subscription.create({
    data: {
      businessId,
      plan,
      status: 'pending',
      mpPreapprovalId: preapproval.id,
      amount: preapproval.auto_recurring?.transaction_amount ?? 0,
      currency: 'ARS',
      frequency,
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.business.update({
    where: { id: businessId },
    data: { subscriptionId: sub.id },
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId,
    action: 'subscription.create',
    targetType: 'subscription',
    targetId: sub.id,
    metadata: { plan, frequency },
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ subscriptionId: sub.id, initPoint: preapproval.init_point });
}
