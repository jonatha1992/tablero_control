import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

  assertSameTenant(user.data, { businessId });

  const status = searchParams.get('status');
  const locations = status === 'active'
    ? await locationService.getActiveLocations(businessId)
    : await locationService.getByBusiness(businessId);

  return NextResponse.json(locations);
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    if (!body.businessId || !body.name) {
      return NextResponse.json({ error: 'businessId y name son requeridos' }, { status: 400 });
    }

    assertSameTenant(user.data, { businessId: body.businessId });

    const location = await locationService.create({
      businessId: body.businessId,
      name: body.name,
      type: body.type || 'department',
      description: body.description,
      address: body.address,
      status: body.status || 'active',
      teamIds: [],
      taskIds: [],
      metadata: body.metadata || {},
    });

    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: user.businessId,
      action: 'business.update',
      targetType: 'LOCATION',
      targetId: location.id,
      metadata: { name: location.name },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
