import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { businessRepository } from '@/repositories';

export async function GET(req: NextRequest) {
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
}

export async function PATCH(req: NextRequest) {
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
      entityType: body.entityType,
      taskDefaults: body.taskDefaults,
      name: body.name,
      settings: body.settings,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[BUSINESS_CONFIG_PATCH]', error);
    return NextResponse.json({ error: 'update_failed', details: error.message }, { status: 500 });
  }
}
