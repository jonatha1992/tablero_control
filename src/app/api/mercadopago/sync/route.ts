import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { getPreapproval, parseExternalReference } from '@/lib/mercadopago/preapproval';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';
import type { SubscriptionStatus } from '@/types/domain/subscription';

const MP_TO_INTERNAL: Record<string, SubscriptionStatus> = {
  authorized: 'active',
  paused: 'paused',
  cancelled: 'cancelled',
  pending: 'pending',
};

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['admin', 'superadmin']);
  if (denied) return denied;

  const body = await req.json() as { businessId?: string };
  const businessId = user.role === 'superadmin' ? (body.businessId ?? user.businessId) : user.businessId;

  if (!businessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }

  if (user.role === 'admin' && user.businessId !== businessId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const sub = await prisma.subscription.findUnique({ where: { businessId } });
  if (!sub) return NextResponse.json({ error: 'no_subscription' }, { status: 404 });

  if (!sub.mpPreapprovalId) {
    return NextResponse.json({ status: sub.status, synced: false, reason: 'no_preapproval_id' });
  }

  let preapproval;
  try {
    preapproval = await getPreapproval(sub.mpPreapprovalId);
  } catch (err) {
    return NextResponse.json({ error: 'mp_api_error', detail: String(err) }, { status: 502 });
  }

  const newStatus = MP_TO_INTERNAL[preapproval.status] ?? 'pending';

  if (newStatus === sub.status) {
    return NextResponse.json({ status: newStatus, synced: false, reason: 'already_up_to_date' });
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: newStatus, mpPayerId: preapproval.payer_id ?? null },
  });

  if (newStatus === 'active') {
    const ref = parseExternalReference(preapproval.external_reference);
    if (ref) {
      const flags: Record<string, boolean> = {
        canExportReports: ref.plan !== 'free' && ref.plan !== 'basic',
      };
      await prisma.business.update({
        where: { id: businessId },
        data: {
          plan: ref.plan,
          status: 'active',
          featureFlags: flags,
          mpPayerId: preapproval.payer_id ?? null,
        },
      });
    }
  }

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId,
    action: 'subscription.update',
    targetType: 'subscription',
    targetId: sub.id,
    metadata: { previousStatus: sub.status, newStatus, mpStatus: preapproval.status },
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ status: newStatus, synced: true });
}
