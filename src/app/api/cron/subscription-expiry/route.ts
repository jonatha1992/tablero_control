import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { SubscriptionExpiryEmail } from '@/lib/mail/templates/subscription-expiry-email';
import { PLANS } from '@/lib/mercadopago/plans';
import * as React from 'react';

const WARN_DAYS = 7;

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const warnThreshold = new Date(now.getTime() + WARN_DAYS * 24 * 60 * 60 * 1000);

  // Mark expired active subscriptions as past_due
  const expired = await prisma.subscription.updateMany({
    where: {
      status: 'active',
      currentPeriodEnd: { lt: now },
    },
    data: { status: 'past_due' },
  });

  // Also update business status for past_due
  const pastDueSubs = await prisma.subscription.findMany({
    where: { status: 'past_due' },
    select: { businessId: true },
  });
  if (pastDueSubs.length > 0) {
    await prisma.business.updateMany({
      where: { id: { in: pastDueSubs.map((s) => s.businessId) } },
      data: { status: 'suspended' },
    });
  }

  // Find subscriptions expiring within warn window (not yet notified today)
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
  let emailsSent = 0;

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

    await resend.emails.send({
      from: 'Tablero de Control <noreply@tecnofusion.io>',
      to: admin.email,
      subject: `Tu suscripción vence en ${daysLeft} días`,
      react: React.createElement(SubscriptionExpiryEmail, {
        businessName: sub.business.name,
        planName: PLANS[sub.plan].name,
        expiryDate,
        renewUrl: `${appUrl}/dashboard/billing`,
        daysLeft,
      }),
    });

    emailsSent++;
  }

  return NextResponse.json({
    ok: true,
    markedPastDue: expired.count,
    emailsSent,
  });
}
