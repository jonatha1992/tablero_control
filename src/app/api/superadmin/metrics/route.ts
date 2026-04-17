import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const db = getAdminDb();

  const [businessesSnap, usersSnap, tasksSnap, subscriptionsSnap] = await Promise.all([
    db.collection('businesses').get(),
    db.collection('users').get(),
    db.collection('tasks').get(),
    db.collection('subscriptions').where('status', '==', 'active').get(),
  ]);

  const businesses = businessesSnap.docs.map((d) => d.data());
  const active = businesses.filter((b) => b.status === 'active').length;
  const suspended = businesses.filter((b) => b.status === 'suspended').length;
  const trial = businesses.filter((b) => b.status === 'trial').length;

  const planCount: Record<string, number> = { free: 0, basic: 0, pro: 0, enterprise: 0 };
  for (const b of businesses) planCount[b.plan as string] = (planCount[b.plan as string] ?? 0) + 1;

  const PRICES: Record<string, number> = { basic: 3999, pro: 9999, enterprise: 0 };
  const mrr = subscriptionsSnap.docs.reduce((acc, d) => acc + (d.data().amount as number ?? 0), 0);

  return NextResponse.json({
    businesses: { total: businessesSnap.size, active, suspended, trial },
    users: { total: usersSnap.size },
    tasks: { total: tasksSnap.size },
    subscriptions: { active: subscriptionsSnap.size, mrr },
    planBreakdown: planCount,
  });
}
