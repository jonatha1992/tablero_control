import { NextRequest, NextResponse } from 'next/server';
import { objectiveService } from '@/services/objective.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id: objectiveId } = await params;
  const objective = await objectiveService.getObjectiveById(objectiveId);
  if (!objective) {
    return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, objective.businessId);

  const { taskIds, action } = await request.json();

  if (!Array.isArray(taskIds) || taskIds.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'taskIds debe ser un arreglo de strings' }, { status: 400 });
  }

  if (action !== undefined && action !== 'assign' && action !== 'remove') {
    return NextResponse.json({ error: "action debe ser 'assign' o 'remove'" }, { status: 400 });
  }

  if (taskIds.length > 0 && action !== 'remove') {
    const validCount = await (await import('@/lib/prisma')).prisma.task.count({
      where: {
        id: { in: taskIds },
        OR: [
          { project: { businessId: objective.businessId } },
          { location: { businessId: objective.businessId } },
          { creator: { businessId: objective.businessId } },
        ],
      },
    });
    if (validCount !== taskIds.length) {
      return NextResponse.json({ error: 'Una o más tareas no pertenecen a este negocio' }, { status: 403 });
    }
  }

  if (action === 'remove') {
    await objectiveService.removeTasks(objectiveId, taskIds);
  } else {
    await objectiveService.assignTasks(objectiveId, taskIds);
  }

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'objective.update',
    targetType: 'OBJECTIVE',
    targetId: objectiveId,
    metadata: { action: action ?? 'assign', taskIds },
  });

  return NextResponse.json({ ok: true });
});
