import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  if (!user.businessId) {
    return NextResponse.json({ error: 'business_id_required' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const subscriptionId = searchParams.get('subscriptionId');

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId: user.businessId,
      ...(subscriptionId ? { subscriptionId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json(invoices);
});
