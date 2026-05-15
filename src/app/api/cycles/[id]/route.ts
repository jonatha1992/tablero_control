import { NextRequest, NextResponse } from 'next/server';
import { cycleService } from '@/services/cycle.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
<<<<<<< HEAD
import { sendNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb

export const GET = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const cycle = await cycleService.getCycleById(id);
  if (!cycle) {
    return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, cycle.businessId);
  return NextResponse.json(cycle);
});

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { _action, ...data } = body;

  const toDateTime = (d: string | undefined | null): Date | undefined =>
    d ? new Date(d.includes('T') ? d : `${d}T00:00:00.000Z`) : undefined;
  if (data.startDate !== undefined) data.startDate = toDateTime(data.startDate as string | null) as unknown;
  if (data.endDate !== undefined) data.endDate = toDateTime(data.endDate as string | null) as unknown;

  const cycle = await cycleService.getCycleById(id);
  if (!cycle) {
    return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, cycle.businessId);

  let updated;
  switch (_action) {
    case 'start':
      updated = await cycleService.startCycle(id);
      break;
    case 'complete':
      updated = await cycleService.completeCycle(id);
      break;
    case 'close':
      updated = await cycleService.closeCycle(id);
      break;
    default:
      updated = await cycleService.updateCycle(id, data);
  }

<<<<<<< HEAD
  if (_action === 'start' || _action === 'complete' || _action === 'close') {
    const labels: Record<string, string> = { start: 'está activo', complete: 'fue completado', close: 'fue cerrado' };
    const notifBody = `El período "${cycle.name}" ${labels[_action as string]}`;
    prisma.userBusiness.findMany({ where: { businessId: cycle.businessId, isActive: true }, select: { userId: true } })
      .then((members) => {
        for (const m of members) {
          if (m.userId === user.uid) continue;
          sendNotification({ userId: m.userId, title: 'Período actualizado', body: notifBody, type: 'info', link: '/dashboard/planificacion' }).catch(() => {});
        }
      }).catch(() => {});
  }

=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'cycle.update',
    targetType: 'CYCLE',
    targetId: id,
    metadata: { _action, ...data },
  });

  return NextResponse.json(updated);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const cycle = await cycleService.getCycleById(id);
  if (!cycle) {
    return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, cycle.businessId);

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
