import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { createCheckoutPreference } from '@/lib/mercadopago/preference';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';
import type { BillingFrequency, PlanId } from '@/types/domain/subscription';
import { handle } from '@/lib/api/route-handler';

export const POST = handle(async (req: NextRequest) => {
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

  const planDef = await getEffectivePlanConfig(plan);
  const amount = frequency === 'monthly' ? planDef.priceMonthly : planDef.priceYearly;

  const preference = await createCheckoutPreference({
    plan,
    frequency,
    businessId,
    successUrl: `${origin}/dashboard/billing?status=success`,
    failureUrl: `${origin}/dashboard/billing?status=failure`,
    pendingUrl: `${origin}/dashboard/billing?status=pending`,
    notificationUrl: `${origin}/api/mercadopago/webhook`,
  });

  const sub = await prisma.subscription.upsert({
    where: { businessId },
    create: {
      businessId,
      plan,
      status: 'pending',
      mpPreferenceId: preference.id,
      amount,
      currency: 'ARS',
      frequency,
      cancelAtPeriodEnd: false,
    },
    update: {
      plan,
      status: 'pending',
      mpPreferenceId: preference.id,
      frequency,
    },
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId,
    action: 'subscription.checkout_initiated',
    targetType: 'subscription',
    targetId: sub.id,
    metadata: { plan, frequency, preferenceId: preference.id },
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ subscriptionId: sub.id, initPoint: preference.init_point });
});
