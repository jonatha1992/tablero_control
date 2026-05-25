import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { mpFetch } from '@/lib/mercadopago/client';
import { parseExternalReference } from '@/lib/mercadopago/preference';
import { getPreapproval, cancelPreapproval, createPreapproval } from '@/lib/mercadopago/preapproval';
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

async function createRecoveryPreapproval(sub: PendingSubForRecovery, businessId: string) {
  if (sub.plan === 'free' || sub.plan === 'enterprise') {
    throw new Error(`Plan ${sub.plan} no permite checkout automático`);
  }

  const origin = process.env.MP_CALLBACK_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) {
    throw new Error('MP_CALLBACK_URL o NEXT_PUBLIC_APP_URL no configurado');
  }

  if (sub.mpPreferenceId) {
    try {
      await cancelPreapproval(sub.mpPreferenceId);
    } catch {
      // Best effort: the previous preapproval may already be cancelled or expired.
    }
  }

  const newPreapproval = await createPreapproval({
    plan: sub.plan as PlanId,
    frequency: sub.frequency as BillingFrequency,
    businessId,
    backUrl: `${origin}/dashboard/billing?status=pending`,
    payerEmail: '',
  });

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { mpPreferenceId: newPreapproval.id },
  });

  return {
    preapprovalActivated: 0,
    recovered: 0,
    status: 'pending',
    initPoint: newPreapproval.init_point,
    message: 'Nueva suscripción creada. Completá el pago.',
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

  // --- Preapproval status check ---
  // For brand-new subscriptions the first recurring charge may not have fired yet,
  // but the preapproval itself becomes "authorized" immediately after the user pays.
  // Without webhooks (local dev) we poll this here before falling through to the
  // payment-search logic below.
  let preapprovalActivated = 0;

  if (sub.mpPreferenceId && sub.status === 'pending') {
    try {
      const preapproval = await getPreapproval(sub.mpPreferenceId);

      if (preapproval.status === 'authorized') {
        const ref = parseExternalReference(preapproval.external_reference);
        const now = new Date();
        const periodDays = ref?.frequency === 'yearly' ? 365 : 30;
        const newEnd = addDays(now, periodDays);
        const activatedPlan = ref?.plan ?? (sub.plan as PlanId);

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: newEnd,
            nextBillingDate: newEnd,
          },
        });

        await prisma.business.update({
          where: { id: ref?.businessId ?? businessId },
          data: { status: 'active', plan: activatedPlan },
        });

        await writeAuditLog({
          actorId: 'system',
          actorRole: 'superadmin',
          businessId,
          action: 'subscription.activated',
          targetType: 'subscription',
          targetId: sub.id,
          metadata: { via: 'preapproval_recover', mpPreferenceId: sub.mpPreferenceId },
          ip: req.headers.get('x-forwarded-for') ?? undefined,
        });

        preapprovalActivated = 1;
      }
    } catch (err) {
      console.error('[recover] preapproval check failed, continuing to payment search:', err);
    }
  }
  // --- End preapproval status check ---

  // If preapproval was activated above, we're done — no need to search payments
  if (preapprovalActivated > 0) {
    return NextResponse.json({ preapprovalActivated, recovered: 0 });
  }

  // If preapproval is still pending, cancel old and create new one (without payer_email restriction)
  if (sub.mpPreferenceId && sub.status === 'pending') {
    try {
      const preapproval = await getPreapproval(sub.mpPreferenceId);
      if (preapproval.status === 'pending') {
        return NextResponse.json(await createRecoveryPreapproval(sub, businessId));
      }
    } catch (err) {
      console.error('[recover] recreate preapproval failed:', err);
      // fall through to payment search
    }
  }

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
        `/preapproval/search?preapproval_id=${sub.mpPreferenceId}&status=authorized&limit=5`
      );
      payments = result.results ?? [];
    } catch {
      // Preapproval search may not return payments — not fatal
      payments = [];
    }
  }

  if (payments.length === 0) {
    if (sub.status === 'pending') {
      try {
        return NextResponse.json(await createRecoveryPreapproval(sub, businessId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[recover] create recovery preapproval failed:', msg);
        return NextResponse.json({ error: 'mp_recovery_checkout_failed', detail: msg }, { status: 502 });
      }
    }

    return NextResponse.json({ preapprovalActivated, recovered: 0, message: 'No approved payments found in MP' });
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
    preapprovalActivated,
    recovered,
    total: payments.length,
    ...(errors.length > 0 ? { errors } : {}),
  });
});
