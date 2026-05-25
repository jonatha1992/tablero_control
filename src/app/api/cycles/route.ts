import { NextRequest, NextResponse } from 'next/server';
import { cycleService } from '@/services/cycle.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { can } from '@/lib/permissions/matrix';
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

function toDateTime(d: string | undefined | null): Date | undefined {
  if (!d) return undefined;
  return new Date(d.includes('T') ? d : `${d}T00:00:00.000Z`);
}

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  if (!can(user.data, 'task.create')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const cycle = await cycleService.createCycle({
    name: body.name as string,
    goal: body.goal as string | undefined,
    businessId: user.businessId ?? '',
    status: (body.status as string | undefined) === 'active' ? 'active' : 'planning',
    startDate: toDateTime(body.startDate as string | null),
    endDate: toDateTime(body.endDate as string | null),
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
