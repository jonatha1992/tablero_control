import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getPreapproval, parseExternalReference } from '@/lib/mercadopago/preapproval';
import { mpFetch } from '@/lib/mercadopago/client';
import { writeAuditLog } from '@/lib/api/audit';
import { Timestamp } from 'firebase-admin/firestore';
import { createHmac, timingSafeEqual } from 'crypto';
import type { SubscriptionStatus } from '@/types/domain/subscription';

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // skip en dev sin secret configurado
  const sig = req.headers.get('x-signature') ?? '';
  const ts = req.headers.get('x-request-id') ?? '';
  const signed = `id=${ts};request-id=${ts};ts=${ts};`;
  const expected = createHmac('sha256', secret).update(signed + rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

const MP_TO_INTERNAL: Record<string, SubscriptionStatus> = {
  authorized: 'active',
  paused: 'paused',
  cancelled: 'cancelled',
  pending: 'pending',
};

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

  const db = getAdminDb();

  if (type === 'subscription_preapproval') {
    const preapproval = await getPreapproval(dataId);
    const ref = parseExternalReference(preapproval.external_reference);
    if (!ref) return NextResponse.json({ ok: true });

    const status = MP_TO_INTERNAL[preapproval.status] ?? 'pending';
    const now = Timestamp.now();

    const subsSnap = await db
      .collection('subscriptions')
      .where('mpPreapprovalId', '==', dataId)
      .limit(1)
      .get();

    if (!subsSnap.empty) {
      const subDoc = subsSnap.docs[0];
      await subDoc.ref.update({ status, mpPayerId: preapproval.payer_id ?? null, updatedAt: now });
    }

    if (status === 'active') {
      const flags: Record<string, boolean> = { canExportReports: ref.plan !== 'free' && ref.plan !== 'basic' };
      await db.collection('businesses').doc(ref.businessId).update({
        plan: ref.plan,
        status: 'active',
        featureFlags: flags,
        mpPayerId: preapproval.payer_id ?? null,
        updatedAt: now,
      });

      await writeAuditLog({
        actorId: 'system',
        actorRole: 'superadmin',
        businessId: ref.businessId,
        action: 'subscription.update',
        targetType: 'subscription',
        targetId: dataId,
        metadata: { status, plan: ref.plan },
      });
    }
  }

  if (type === 'payment') {
    interface MpPayment { id: string; status: string; transaction_amount: number; external_reference?: string; preapproval_id?: string }
    const payment = await mpFetch<MpPayment>(`/v1/payments/${dataId}`);
    const ref = parseExternalReference(payment.external_reference);
    if (!ref) return NextResponse.json({ ok: true });

    const invoiceStatus = payment.status === 'approved' ? 'paid' : payment.status === 'rejected' ? 'failed' : 'pending';
    const subsSnap = await db
      .collection('subscriptions')
      .where('mpPreapprovalId', '==', payment.preapproval_id ?? '')
      .limit(1)
      .get();

    if (!subsSnap.empty) {
      const subDoc = subsSnap.docs[0];
      const invRef = subDoc.ref.collection('invoices').doc();
      await invRef.set({
        subscriptionId: subDoc.id,
        businessId: ref.businessId,
        amount: payment.transaction_amount,
        currency: 'ARS',
        status: invoiceStatus,
        mpPaymentId: String(payment.id),
        paidAt: invoiceStatus === 'paid' ? Timestamp.now() : null,
        createdAt: Timestamp.now(),
      });

      await writeAuditLog({
        actorId: 'system',
        actorRole: 'superadmin',
        businessId: ref.businessId,
        action: invoiceStatus === 'paid' ? 'invoice.paid' : 'invoice.failed',
        targetType: 'invoice',
        targetId: invRef.id,
        metadata: { amount: payment.transaction_amount, mpPaymentId: payment.id },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
