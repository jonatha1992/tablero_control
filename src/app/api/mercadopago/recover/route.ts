import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { mpFetch } from '@/lib/mercadopago/client';
import { createCheckoutPreference, parseExternalReference } from '@/lib/mercadopago/preference';
import { writeAuditLog } from '@/lib/api/audit';
import type { PlanId, BillingFrequency } from '@/types/domain/subscription';
import { handle } from '@/lib/api/route-handler';

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

interface MpPayment {
  id: string;
  status: string;
  transaction_amount: number;
  external_reference?: string;
  date_approved?: string;
}

interface MpSearchResult {
  results: MpPayment[];
}

interface SubSnapshot {
  id: string;
  businessId: string;
  currentPeriodEnd: Date | null;
  frequency: BillingFrequency;
}

interface PendingSubForRecovery {
  id: string;
  plan: string;
  frequency: string;
  mpPreferenceId: string | null;
}

async function createRecoveryCheckout(sub: PendingSubForRecovery, businessId: string) {
  if (sub.plan === 'free' || sub.plan === 'enterprise') {
    throw new Error(`Plan ${sub.plan} no permite checkout automático`);
  }

  const callbackOrigin = process.env.MP_CALLBACK_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!callbackOrigin) {
    throw new Error('MP_CALLBACK_URL o NEXT_PUBLIC_APP_URL no configurado');
  }

  const preference = await createCheckoutPreference({
    plan: sub.plan as PlanId,
    frequency: sub.frequency as BillingFrequency,
    businessId,
    successUrl: `${callbackOrigin}/dashboard/billing?status=success`,
    failureUrl: `${callbackOrigin}/dashboard/billing?status=failure`,
    pendingUrl: `${callbackOrigin}/dashboard/billing?status=pending`,
    notificationUrl: `${callbackOrigin}/api/mercadopago/webhook`,
  });

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { mpPreferenceId: preference.id },
  });

  return {
    recovered: 0,
    status: 'pending',
    initPoint: preference.init_point,
    message: 'Checkout creado. Completá el pago.',
  };
}

async function processApprovedPayment(payment: MpPayment, sub: SubSnapshot, plan: PlanId) {
  const now = new Date();
  const periodDays = sub.frequency === 'yearly' ? 365 : 30;
  const base = sub.currentPeriodEnd && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
  const newEnd = addDays(base, periodDays);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'active', plan, currentPeriodStart: now, currentPeriodEnd: newEnd, nextBillingDate: newEnd },
  });

  await prisma.business.update({
    where: { id: sub.businessId },
    data: { status: 'active', plan },
  });

  await prisma.invoice.create({
    data: {
      subscriptionId: sub.id,
      businessId: sub.businessId,
      amount: payment.transaction_amount,
      currency: 'ARS',
      status: 'paid',
      mpPaymentId: String(payment.id),
      paidAt: payment.date_approved ? new Date(payment.date_approved) : now,
    },
  });
}

// POST /api/mercadopago/recover
// Body: { businessId?: string; paymentId?: string }
// Superadmin: any businessId. Admin: solo su propio business.
export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['admin', 'superadmin']);
  if (denied) return denied;

  const body = await req.json() as { businessId?: string; paymentId?: string };
  const businessId = user.role === 'superadmin' ? (body.businessId ?? user.businessId) : user.businessId;

  if (!businessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }
  if (user.role === 'admin' && user.businessId !== businessId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const sub = await prisma.subscription.findUnique({ where: { businessId } });
  if (!sub) return NextResponse.json({ error: 'no_subscription' }, { status: 404 });

  let payments: MpPayment[] = [];

  if (body.paymentId) {
    try {
      const p = await mpFetch<MpPayment>(`/v1/payments/${body.paymentId}`);
      payments = [p];
    } catch {
      return NextResponse.json({ error: 'payment_not_found_in_mp' }, { status: 404 });
    }
  } else if (sub.mpPreferenceId) {
    try {
      const result = await mpFetch<MpSearchResult>(
        `/v1/payments/search?preference_id=${sub.mpPreferenceId}&status=approved&limit=5`
      );
      payments = result.results ?? [];
    } catch {
      payments = [];
    }
  }

  if (payments.length === 0) {
    if (sub.status === 'pending') {
      try {
        return NextResponse.json(await createRecoveryCheckout(sub, businessId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[recover] create recovery checkout failed:', msg);
        return NextResponse.json({ error: 'mp_recovery_checkout_failed', detail: msg }, { status: 502 });
      }
    }

    return NextResponse.json({ recovered: 0, message: 'No approved payments found in MP' });
  }

  const existingMpIds = await prisma.invoice.findMany({
    where: { businessId, mpPaymentId: { not: null } },
    select: { mpPaymentId: true },
  });
  const existingSet = new Set(existingMpIds.map((i) => i.mpPaymentId));

  const subSnapshot: SubSnapshot = {
    id: sub.id,
    businessId,
    currentPeriodEnd: sub.currentPeriodEnd,
    frequency: sub.frequency as BillingFrequency,
  };

  let recovered = 0;
  const errors: string[] = [];

  for (const payment of payments) {
    if (payment.status !== 'approved') continue;
    if (existingSet.has(String(payment.id))) continue;

    const ref = parseExternalReference(payment.external_reference);
    const plan: PlanId = ref?.plan ?? (sub.plan as PlanId);

    try {
      await processApprovedPayment(payment, subSnapshot, plan);

      await writeAuditLog({
        actorId: user.uid,
        actorRole: user.role,
        businessId,
        action: 'invoice.recovered',
        targetType: 'invoice',
        targetId: sub.id,
        metadata: { mpPaymentId: payment.id, amount: payment.transaction_amount, plan },
        ip: req.headers.get('x-forwarded-for') ?? undefined,
      });

      recovered++;
    } catch (err) {
      errors.push(`Payment ${payment.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    recovered,
    total: payments.length,
    ...(errors.length > 0 ? { errors } : {}),
  });
});
