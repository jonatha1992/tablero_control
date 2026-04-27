import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPreapproval, parseExternalReference } from '@/lib/mercadopago/preapproval';
import { mpFetch } from '@/lib/mercadopago/client';
import { writeAuditLog } from '@/lib/api/audit';
import { createHmac, timingSafeEqual } from 'crypto';
import type { SubscriptionStatus } from '@/types/domain/subscription';

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;

  const xSig = req.headers.get('x-signature') ?? '';
  const requestId = req.headers.get('x-request-id') ?? '';

  // MP test notifications from dashboard may omit signature headers — allow through
  if (!xSig) return true;

  const tsMatch = xSig.match(/ts=([^,]+)/);
  const v1Match = xSig.match(/v1=([^,]+)/);
  if (!tsMatch || !v1Match) return false;
  const ts = tsMatch[1];
  const v1 = v1Match[1];

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
    return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
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
}

export async function POST(req: NextRequest) {
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
<<<<<<< HEAD
<<<<<<< HEAD
=======

>>>>>>> d747ee80fb036fb8fe78b085291cb406d1393fda
=======

>>>>>>> 379f4db4f7ef0c6c5650dcbeedbe82c11810886f
    const ref = parseExternalReference(preapproval.external_reference);
    if (!ref) return NextResponse.json({ ok: true });

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

      await prisma.subscription.updateMany({
        where: { mpPreferenceId: dataId },
        data: { status, mpPayerId: mpPayerIdStr, ...periodData },
      });

      if (status === 'active') {
        const flags: Record<string, boolean> = {
          canExportReports: ref.plan !== 'free' && ref.plan !== 'basic',
        };

        await prisma.business.update({
          where: { id: ref.businessId },
          data: {
            plan: ref.plan,
            status: 'active',
            featureFlags: flags,
            mpPayerId: mpPayerIdStr,
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
<<<<<<< HEAD
<<<<<<< HEAD
=======

>>>>>>> d747ee80fb036fb8fe78b085291cb406d1393fda
=======

>>>>>>> 379f4db4f7ef0c6c5650dcbeedbe82c11810886f
    const ref = parseExternalReference(payment.external_reference);
    if (!ref) return NextResponse.json({ ok: true });

    const invoiceStatus = payment.status === 'approved' ? 'paid'
      : payment.status === 'rejected' ? 'failed'
        : 'pending';

    try {
      const sub = await prisma.subscription.findFirst({
        where: { businessId: ref.businessId },
      });

      if (sub) {
        if (payment.status === 'approved') {
          const now = new Date();
          const periodDays = ref.frequency === 'yearly' ? 365 : 30;
          // Extend from current end or from now if expired
          const base = sub.currentPeriodEnd && sub.currentPeriodEnd > now
            ? sub.currentPeriodEnd
            : now;
          const newEnd = addDays(base, periodDays);

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
            where: { id: ref.businessId },
            data: { status: 'active', plan: ref.plan },
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
            paidAt: invoiceStatus === 'paid' ? new Date() : null,
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
      }
    } catch (err) {
      console.error('[webhook] payment db error:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
