import { NextRequest, NextResponse } from 'next/server';
import { cycleService } from '@/services/cycle.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const cycle = await cycleService.getCycleById(id);
  if (!cycle) {
    return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 });
  }
  return NextResponse.json(cycle);
});

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const body = await request.json();
  const { _action, ...data } = body;

  let cycle;
  switch (_action) {
    case 'start':
      cycle = await cycleService.startCycle(id);
      break;
    case 'complete':
      cycle = await cycleService.completeCycle(id);
      break;
    case 'close':
      cycle = await cycleService.closeCycle(id);
      break;
    default:
      cycle = await cycleService.updateCycle(id, data);
  }

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'cycle.update',
    targetType: 'CYCLE',
    targetId: id,
    metadata: { _action, ...data },
  });

  return NextResponse.json(cycle);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  await cycleService.deleteCycle(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'cycle.delete',
    targetType: 'CYCLE',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
});
