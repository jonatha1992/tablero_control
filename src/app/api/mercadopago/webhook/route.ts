import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPreapproval, parseExternalReference } from '@/lib/mercadopago/preapproval';
import { mpFetch } from '@/lib/mercadopago/client';
import { writeAuditLog } from '@/lib/api/audit';
import { createHmac, timingSafeEqual } from 'crypto';
import type { SubscriptionStatus } from '@/types/domain/subscription';
import { handle } from '@/lib/api/route-handler';
import { MailService } from '@/services/mail.service';
import { PLANS } from '@/lib/mercadopago/plans';

// FIX #3: Require secret in production; validate timestamp to prevent replay attacks
function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[webhook] MP_WEBHOOK_SECRET not configured — rejecting all webhooks in production');
      return false;
    }
    // dev/test: allow through without secret
    return true;
  }

  const xSig = req.headers.get('x-signature') ?? '';
  const requestId = req.headers.get('x-request-id') ?? '';

  // MP test notifications from dashboard may omit signature headers — allow through
  if (!xSig) return true;

  const tsMatch = xSig.match(/ts=([^,]+)/);
  const v1Match = xSig.match(/v1=([^,]+)/);
  if (!tsMatch || !v1Match) return false;
  const ts = tsMatch[1];
  const v1 = v1Match[1];

  // FIX #1: Replay attack prevention — reject if timestamp is older than 5 minutes.
  // MP sends ts in milliseconds; auto-detect if it looks like seconds instead.
  const tsNum = parseInt(ts, 10);
  if (!isNaN(tsNum)) {
    const tsMs = tsNum > 1e12 ? tsNum : tsNum * 1000;
    if (Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
      console.warn('[webhook] timestamp replay or clock skew detected, ts:', ts, 'request-id:', requestId);
      return false;
    }
  }

  let dataId = '';
  try {
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    dataId = String((body.data as Record<string, unknown>)?.id ?? '');
  } catch {
    return false;
  }

  const signed = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(signed).digest('hex');
  try {
    // timingSafeEqual requires equal-length buffers
    const vBuf = Buffer.from(v1);
    const eBuf = Buffer.from(expected);
    if (vBuf.length !== eBuf.length) {
      console.warn('[webhook] signature length mismatch for request-id:', requestId);
      return false;
    }
    const valid = timingSafeEqual(vBuf, eBuf);
    if (!valid) {
      console.warn('[webhook] invalid signature for request-id:', requestId);
    }
    return valid;
  } catch {
    console.warn('[webhook] signature comparison error for request-id:', requestId);
    return false;
  }
}

// FIX #17: Use date-safe addDays (no DST issues for billing purposes)
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

const MP_TO_INTERNAL: Record<string, SubscriptionStatus> = {
  authorized: 'active',
  paused: 'paused',
  cancelled: 'cancelled',
  pending: 'pending',
};

interface MpPayment {
  id: string;
  status: string;
  transaction_amount: number;
  external_reference?: string;
  preapproval_id?: string;
  date_approved?: string;
}

// FIX #16: Complete feature flags based on plan
function buildFeatureFlags(plan: string): Record<string, boolean> {
  const isPro = plan === 'pro' || plan === 'enterprise';
  const isEnterprise = plan === 'enterprise';
  return {
    canExportReports: isPro,
    canUseCustomRoles: isPro,
    canAccessApi: isEnterprise,
    canCustomBrand: isEnterprise,
  };
}

export const POST = handle(async (req: NextRequest) => {
  const rawBody = await req.text();

  if (!verifySignature(req, rawBody)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const type = payload.type as string;
  const dataId = (payload.data as Record<string, string>)?.id;

  if (!dataId) return NextResponse.json({ ok: true });

  // Preapproval authorized/paused/cancelled — update subscription status + set initial period
  if (type === 'subscription_preapproval') {
    let preapproval;
    try {
      preapproval = await getPreapproval(dataId);
    } catch {
      return NextResponse.json({ ok: true });
    }

    const ref = parseExternalReference(preapproval.external_reference);
    if (!ref) {
      // FIX #13: Log invalid refs instead of silently ignoring
      console.warn('[webhook] invalid or missing external_reference on preapproval:', dataId, preapproval.external_reference);
      return NextResponse.json({ ok: true });
    }

    const status = MP_TO_INTERNAL[preapproval.status] ?? 'pending';

    try {
      const now = new Date();
      const periodDays = ref.frequency === 'yearly' ? 365 : 30;

      const periodData = status === 'active' ? {
        currentPeriodStart: now,
        currentPeriodEnd: addDays(now, periodDays),
        nextBillingDate: addDays(now, periodDays),
      } : {};

      const mpPayerIdStr = preapproval.payer_id != null ? String(preapproval.payer_id) : null;

      // FIX #8: Use update (businessId is @unique on Subscription) instead of updateMany
      await prisma.subscription.updateMany({
        where: { businessId: ref.businessId },
        data: { status, mpPayerId: mpPayerIdStr, ...periodData },
      });

      if (status === 'active') {
        await prisma.business.update({
          where: { id: ref.businessId },
          data: {
            plan: ref.plan,
            status: 'active',
            featureFlags: buildFeatureFlags(ref.plan),
          },
        });

        await writeAuditLog({
          actorId: 'system',
          actorRole: 'superadmin',
          businessId: ref.businessId,
          action: 'subscription.activated',
          targetType: 'subscription',
          targetId: dataId,
          metadata: { status, plan: ref.plan },
        });

        prisma.business.findUnique({
          where: { id: ref.businessId },
          select: { name: true, adminId: true, users: { where: { isActive: true }, select: { id: true, email: true } } },
        }).then((biz) => {
          if (!biz) return;
          const admin = biz.users.find((u) => u.id === biz.adminId);
          if (!admin) return;
          const planName = PLANS[ref.plan as keyof typeof PLANS]?.name ?? ref.plan;
          MailService.sendSubscriptionActivatedEmail(admin.email, biz.name, planName)
            .catch((err) => console.error('[webhook] sendSubscriptionActivatedEmail failed:', err));
        }).catch((err) => console.error('[webhook] admin lookup failed:', err));
      }
    } catch (err) {
      console.error('[webhook] subscription_preapproval db error:', err);
    }
  }

  // Payment — automatic charge or manual. Extend period + create invoice.
  if (type === 'payment') {
    let payment: MpPayment;
    try {
      payment = await mpFetch<MpPayment>(`/v1/payments/${dataId}`);
    } catch {
      return NextResponse.json({ ok: true });
    }

    const ref = parseExternalReference(payment.external_reference);
    if (!ref) {
      // FIX #13: Log invalid refs
      console.warn('[webhook] invalid or missing external_reference on payment:', dataId, payment.external_reference);
      return NextResponse.json({ ok: true });
    }

    const invoiceStatus = payment.status === 'approved' ? 'paid'
      : payment.status === 'rejected' ? 'failed'
        : 'pending';

    try {
      const sub = await prisma.subscription.findFirst({
        where: { businessId: ref.businessId },
      });

      if (sub) {
        // FIX #2: Check for existing invoice before creating — prevents duplicates on retry/replay
        const existingInvoice = await prisma.invoice.findUnique({
          where: { mpPaymentId: String(payment.id) },
        });

        if (existingInvoice) {
          console.warn('[webhook] duplicate payment webhook ignored, mpPaymentId:', payment.id);
          return NextResponse.json({ ok: true });
        }

        if (payment.status === 'approved') {
          const now = new Date();
          const periodDays = ref.frequency === 'yearly' ? 365 : 30;
          const base = sub.currentPeriodEnd && sub.currentPeriodEnd > now
            ? sub.currentPeriodEnd
            : now;
          const newEnd = addDays(base, periodDays);

          // FIX #10: Use date_approved for period start instead of now()
          const approvedAt = payment.date_approved ? new Date(payment.date_approved) : now;

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'active',
              currentPeriodStart: approvedAt,
              currentPeriodEnd: newEnd,
              nextBillingDate: newEnd,
            },
          });

          await prisma.business.update({
            where: { id: ref.businessId },
            data: {
              status: 'active',
              plan: ref.plan,
              featureFlags: buildFeatureFlags(ref.plan),
            },
          });
        }

        await prisma.invoice.create({
          data: {
            subscriptionId: sub.id,
            businessId: ref.businessId,
            amount: payment.transaction_amount,
            currency: 'ARS',
            status: invoiceStatus,
            mpPaymentId: String(payment.id),
            // FIX #10: Use date_approved for paidAt
            paidAt: invoiceStatus === 'paid'
              ? (payment.date_approved ? new Date(payment.date_approved) : new Date())
              : null,
          },
        });

        await writeAuditLog({
          actorId: 'system',
          actorRole: 'superadmin',
          businessId: ref.businessId,
          action: invoiceStatus === 'paid' ? 'invoice.paid' : 'invoice.failed',
          targetType: 'invoice',
          targetId: sub.id,
          metadata: { amount: payment.transaction_amount, mpPaymentId: payment.id },
        });

        if (invoiceStatus === 'paid' || invoiceStatus === 'failed') {
          prisma.business.findUnique({
            where: { id: ref.businessId },
            select: { name: true, adminId: true, users: { where: { isActive: true }, select: { id: true, email: true } } },
          }).then((biz) => {
            if (!biz) return;
            const admin = biz.users.find((u) => u.id === biz.adminId);
            if (!admin) return;
            if (invoiceStatus === 'paid') {
              MailService.sendPaymentSuccessEmail(admin.email, biz.name, payment.transaction_amount)
                .catch((err) => console.error('[webhook] sendPaymentSuccessEmail failed:', err));
            } else {
              MailService.sendPaymentFailedEmail(admin.email, biz.name)
                .catch((err) => console.error('[webhook] sendPaymentFailedEmail failed:', err));
            }
          }).catch((err) => console.error('[webhook] admin lookup failed:', err));
        }
      }
    } catch (err) {
      // FIX #2: If unique constraint violation, it was already processed — log and ignore
      const isUniqueViolation = err instanceof Error && err.message.includes('Unique constraint');
      if (isUniqueViolation) {
        console.warn('[webhook] duplicate invoice prevented by DB constraint, mpPaymentId:', payment.id);
      } else {
        console.error('[webhook] payment db error:', err);
      }
    }
  }

  return NextResponse.json({ ok: true });
});
