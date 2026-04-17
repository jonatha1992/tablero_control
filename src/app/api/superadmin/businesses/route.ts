import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { getAdminDb } from '@/lib/firebase/admin';
import { writeAuditLog } from '@/lib/api/audit';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const db = getAdminDb();
  const snap = await db.collection('businesses').orderBy('createdAt', 'desc').limit(100).get();
  const businesses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ businesses });
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const { businessId, action } = await req.json() as { businessId?: string; action?: 'suspend' | 'reactivate' };
  if (!businessId || !action) return NextResponse.json({ error: 'businessId y action requeridos' }, { status: 400 });

  const db = getAdminDb();
  const now = Timestamp.now();
  const status = action === 'suspend' ? 'suspended' : 'active';
  const extra = action === 'suspend' ? { suspendedAt: now, suspendedReason: 'Suspendido por superadmin' } : { suspendedAt: null };

  await db.collection('businesses').doc(businessId).update({ status, updatedAt: now, ...extra });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    action: action === 'suspend' ? 'business.suspend' : 'business.reactivate',
    targetType: 'business',
    targetId: businessId,
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
