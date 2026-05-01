import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { createPreapproval, cancelPreapproval } from '@/lib/mercadopago/preapproval';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';
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
  if (!user.email) {
    return NextResponse.json({ error: 'user_email_required' }, { status: 400 });
  }

  const origin = process.env.MP_CALLBACK_URL
    ?? (process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://localhost') ? null : process.env.NEXT_PUBLIC_APP_URL)
    ?? req.headers.get('origin')
    ?? 'http://localhost:3000';
  const backUrl = `${origin}/dashboard/billing?status=pending`;

  // Cancel existing preapproval in MP before creating a new one (best effort)
  const existing = await prisma.subscription.findUnique({ where: { businessId } });
  if (existing?.mpPreferenceId) {
    try { await cancelPreapproval(existing.mpPreferenceId); } catch { /* MP may already be cancelled */ }
  }

  const payerEmail = process.env.MP_TEST_PAYER_EMAIL ?? user.email;

  let preapproval;
  try {
    preapproval = await createPreapproval({
      plan,
      frequency,
      payerEmail,
      businessId,
      backUrl,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[preapproval] MP error:', msg);
    return NextResponse.json({ error: 'mp_error', detail: msg }, { status: 502 });
  }

  const sub = await prisma.subscription.upsert({
    where: { businessId },
    create: {
      businessId,
      plan,
      status: 'pending',
      mpPreferenceId: preapproval.id,
      amount: preapproval.auto_recurring?.transaction_amount ?? 0,
      currency: 'ARS',
      frequency,
      cancelAtPeriodEnd: false,
    },
    update: {
      plan,
      status: 'pending',
      mpPreferenceId: preapproval.id,
      amount: preapproval.auto_recurring?.transaction_amount ?? 0,
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
});
