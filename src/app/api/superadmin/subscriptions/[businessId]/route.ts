import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';
import type { PlanId } from '@/types/domain/subscription';

const VALID_PLANS: PlanId[] = ['free', 'basic', 'pro', 'enterprise'];

export const PATCH = handle(async (
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) => {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const { businessId } = await params;

  let body: { plan: PlanId };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (!VALID_PLANS.includes(body.plan)) {
    return NextResponse.json({ error: 'plan_invalido' }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    return NextResponse.json({ error: 'business_not_found' }, { status: 404 });
  }

  const previousPlan = business.plan;

  await prisma.$transaction([
    prisma.business.update({
      where: { id: businessId },
      data: { plan: body.plan },
    }),
    prisma.subscription.upsert({
      where: { businessId },
      create: {
        businessId,
        plan: body.plan,
        status: 'active',
        amount: 0,
      },
      update: {
        plan: body.plan,
        status: 'active',
      },
    }),
  ]);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    action: 'subscription.update',
    targetType: 'Business',
    targetId: businessId,
    metadata: { previousPlan, newPlan: body.plan },
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ ok: true });
});
