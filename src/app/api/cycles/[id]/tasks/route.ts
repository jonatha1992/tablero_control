import { NextRequest, NextResponse } from 'next/server';
import { cycleService } from '@/services/cycle.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id: cycleId } = await params;
  const cycle = await cycleService.getCycleById(cycleId);
  if (!cycle) {
    return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, cycle.businessId);

  const { taskIds, action } = await request.json();

  if (!Array.isArray(taskIds) || taskIds.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'taskIds debe ser un arreglo de strings' }, { status: 400 });
  }

  if (taskIds.length > 0 && action !== 'remove') {
    const validCount = await (await import('@/lib/prisma')).prisma.task.count({
      where: {
        id: { in: taskIds },
        OR: [
          { project: { businessId: cycle.businessId } },
          { location: { businessId: cycle.businessId } },
          { creator: { businessId: cycle.businessId } },
        ],
      },
    });
    if (validCount !== taskIds.length) {
      return NextResponse.json({ error: 'Una o más tareas no pertenecen a este negocio' }, { status: 403 });
    }
  }

  if (action === 'remove') {
    await cycleService.removeTasks(cycleId, taskIds);
  } else {
    await cycleService.assignTasks(cycleId, taskIds);
  }

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'cycle.update',
    targetType: 'CYCLE',
    targetId: cycleId,
    metadata: { action: action ?? 'assign', taskIds },
  });

  return NextResponse.json({ ok: true });
});
