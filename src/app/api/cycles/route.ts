import { NextRequest, NextResponse } from 'next/server';
import { cycleService } from '@/services/cycle.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId') ?? user.businessId;

  if (!businessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }

  assertSameTenant(user.data, { businessId });

  const cycles = await cycleService.getCyclesByBusiness(businessId);
  return NextResponse.json(cycles);
});

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const cycle = await cycleService.createCycle({
    ...body,
    businessId: user.businessId ?? '',
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'cycle.create',
    targetType: 'CYCLE',
    targetId: cycle.id,
    metadata: { name: cycle.name },
  });

  return NextResponse.json(cycle, { status: 201 });
});
