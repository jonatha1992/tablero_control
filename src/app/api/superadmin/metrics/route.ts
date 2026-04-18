import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const [
    totalBusinesses,
    activeBusinesses,
    suspendedBusinesses,
    trialBusinesses,
    totalUsers,
    totalTasks,
    activeSubscriptions,
    freePlan, basicPlan, proPlan, enterprisePlan,
  ] = await prisma.$transaction([
    prisma.business.count(),
    prisma.business.count({ where: { status: 'active' } }),
    prisma.business.count({ where: { status: 'suspended' } }),
    prisma.business.count({ where: { status: 'trial' } }),
    prisma.user.count(),
    prisma.task.count(),
    prisma.subscription.findMany({ where: { status: 'active' }, select: { amount: true } }),
    prisma.business.count({ where: { plan: 'free' } }),
    prisma.business.count({ where: { plan: 'basic' } }),
    prisma.business.count({ where: { plan: 'pro' } }),
    prisma.business.count({ where: { plan: 'enterprise' } }),
  ]);

  const mrr = activeSubscriptions.reduce((acc: number, s: { amount: number }) => acc + s.amount, 0);
  const planCount = { free: freePlan, basic: basicPlan, pro: proPlan, enterprise: enterprisePlan };

  return NextResponse.json({
    businesses: { total: totalBusinesses, active: activeBusinesses, suspended: suspendedBusinesses, trial: trialBusinesses },
    users: { total: totalUsers },
    tasks: { total: totalTasks },
    subscriptions: { active: activeSubscriptions.length, mrr },
    planBreakdown: planCount,
  });
}
