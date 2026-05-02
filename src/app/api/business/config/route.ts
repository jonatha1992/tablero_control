import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { businessRepository } from '@/repositories';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (req: NextRequest) => {
  const authed = await requireUser(req);
  if (authed instanceof NextResponse) return authed;

  if (!authed.businessId) {
    return NextResponse.json({ error: 'business_id_required' }, { status: 400 });
  }

  const business = await businessRepository.findById(authed.businessId);
  if (!business) {
    return NextResponse.json({ error: 'business_not_found' }, { status: 404 });
  }

  return NextResponse.json(business);
});

export const PATCH = handle(async (req: NextRequest) => {
  const authed = await requireUser(req);
  if (authed instanceof NextResponse) return authed;

  // Solo admin o superadmin pueden cambiar la config
  const forbidden = requireRole(authed, ['admin', 'superadmin']);
  if (forbidden) return forbidden;

  if (!authed.businessId) {
    return NextResponse.json({ error: 'business_id_required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    await businessRepository.update(authed.businessId, {
      name: body.name,
      settings: body.settings,
    });

    await writeAuditLog({
      actorId: authed.uid,
      actorRole: authed.role,
      businessId: authed.businessId,
      action: 'business.update',
      targetType: 'BUSINESS',
      targetId: authed.businessId,
      metadata: { fields: Object.keys(body).filter((k) => body[k] !== undefined) },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[BUSINESS_CONFIG_PATCH]', error);
    const msg = error instanceof Error ? error.message : 'update_failed';
    return NextResponse.json({ error: 'update_failed', details: msg }, { status: 500 });
  }
});
