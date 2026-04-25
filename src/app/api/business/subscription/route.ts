import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  if (!user.businessId) {
    return NextResponse.json({ error: 'business_id_required' }, { status: 400 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      businessId: user.businessId,
      status: { in: ['active', 'pending', 'paused', 'trialing'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(subscription ?? null);
}
