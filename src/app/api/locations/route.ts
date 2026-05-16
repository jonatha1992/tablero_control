import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { prisma } from '@/lib/prisma';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

  assertSameTenant(user.data, { businessId });

  const activeMembership = user.data.memberships?.find(
    (m) => m.businessId === businessId && m.isActive
  );
  const userLocationId = activeMembership?.locationId;

  const status = searchParams.get('status');
  let locations = status === 'active'
    ? await locationService.getActiveLocations(businessId)
    : await locationService.getByBusiness(businessId);

  if (userLocationId && user.role !== 'admin' && user.role !== 'superadmin') {
    locations = locations.filter((l) => l.id === userLocationId);
  }

  return NextResponse.json(locations);
});

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    if (!body.businessId || !body.name) {
      return NextResponse.json({ error: 'businessId y name son requeridos' }, { status: 400 });
    }

    assertSameTenant(user.data, { businessId: body.businessId });

    if (user.role !== 'superadmin') {
      const business = await prisma.business.findUnique({
        where: { id: body.businessId },
        select: { plan: true },
      });
      if (business) {
        const planConfig = await getEffectivePlanConfig(business.plan);
        const limit = planConfig.limits.locations;
        if (limit !== -1) {
          const current = await prisma.location.count({
            where: { businessId: body.businessId, status: { not: 'closed' } },
          });
          if (current >= limit) {
            return NextResponse.json(
              { error: 'locations_limit_exceeded', limit, current },
              { status: 429 }
            );
          }
        }
      }
    }

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
});
