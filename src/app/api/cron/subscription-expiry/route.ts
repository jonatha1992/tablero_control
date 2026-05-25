import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/mercadopago/plans';
import { MailService } from '@/services/mail.service';
import { handle } from '@/lib/api/route-handler';

const WARN_DAYS = 7;

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret}`;
}

export const GET = handle(async (req: NextRequest) => {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const warnThreshold = new Date(now.getTime() + WARN_DAYS * 24 * 60 * 60 * 1000);

  let markedPastDue = 0;
  let trialExpired = 0;
  let emailsSent = 0;
  const emailErrors: string[] = [];

  // Trials vencidos → suspender
  try {
    const expiredTrials = await prisma.business.updateMany({
      where: { status: 'trial', trialEndsAt: { lt: now } },
      data: { status: 'suspended' },
    });
    trialExpired = expiredTrials.count;
  } catch (err) {
    console.error('[cron/subscription-expiry] error handling expired trials:', err);
  }

  try {
    // FIX #6: Wrap DB operations in try-catch — failure returns 500 instead of silent 200
    const expired = await prisma.subscription.updateMany({
      where: {
        status: 'active',
        currentPeriodEnd: { lt: now },
      },
      data: { status: 'past_due' },
    });
    markedPastDue = expired.count;

    if (markedPastDue > 0) {
      const pastDueSubs = await prisma.subscription.findMany({
        where: { status: 'past_due' },
        select: { businessId: true },
      });
      await prisma.business.updateMany({
        where: { id: { in: pastDueSubs.map((s) => s.businessId) } },
        data: { status: 'suspended' },
      });
    }
  } catch (err) {
    console.error('[cron/subscription-expiry] DB error marking past_due:', err);
    return NextResponse.json({ error: 'db_error', message: String(err) }, { status: 500 });
  }

  // Cancelar suscripciones con cancelAtPeriodEnd=true que ya vencieron
  let cancelledAtPeriodEnd = 0;
  try {
    const toCancel = await prisma.subscription.findMany({
      where: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { lt: now },
        status: { in: ['active', 'past_due'] },
      },
      select: { id: true, businessId: true },
    });
    for (const sub of toCancel) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'cancelled' } });
      await prisma.business.update({ where: { id: sub.businessId }, data: { status: 'cancelled' } });
      cancelledAtPeriodEnd++;
    }
  } catch (err) {
    console.error('[cron/subscription-expiry] error processing cancelAtPeriodEnd:', err);
  }

  // FIX #6/#7: Expiry warning emails — errors are logged and counted, not silently swallowed
  try {
    const expiring = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: { gte: now, lte: warnThreshold },
      },
      include: {
        business: {
          include: {
            users: {
              where: { isActive: true },
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tablerocontrol.com';

    for (const sub of expiring) {
      const admin = sub.business.users.find((u) => u.id === sub.business.adminId);
      if (!admin) continue;

      const daysLeft = Math.ceil(
        (sub.currentPeriodEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const expiryDate = sub.currentPeriodEnd!.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // FIX #12: Log email failures instead of silently swallowing them
      try {
        await MailService.sendSubscriptionExpiryEmail(admin.email, {
          businessName: sub.business.name,
          planName: PLANS[sub.plan].name,
          expiryDate,
          renewUrl: `${appUrl}/dashboard/billing`,
          daysLeft,
        });
        emailsSent++;
      } catch (err) {
        console.error('[cron/subscription-expiry] email failed:', err);
        emailErrors.push(admin.id);
      }
    }
  } catch (err) {
    console.error('[cron/subscription-expiry] DB error querying expiring subs:', err);
    // Non-critical: return partial success since past_due marking already completed
    return NextResponse.json({
      ok: true,
      markedPastDue,
      emailsSent,
      warning: 'email query failed',
    }, { status: 207 });
  }

  return NextResponse.json({
    ok: true,
    markedPastDue,
    trialExpired,
    cancelledAtPeriodEnd,
    emailsSent,
    ...(emailErrors.length > 0 ? { emailErrors } : {}),
  });
});
