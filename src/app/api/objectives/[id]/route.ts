import { NextRequest, NextResponse } from 'next/server';
import { objectiveService } from '@/services/objective.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { can } from '@/lib/permissions';
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
  const objective = await objectiveService.getObjectiveById(id);
  if (!objective) {
    return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, objective.businessId);
  return NextResponse.json(objective);
});

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const body = await request.json();
  const { _action, ...data } = body;

  const toDateTime = (d: string | undefined | null): Date | undefined =>
    d ? new Date(d.includes('T') ? d : `${d}T00:00:00.000Z`) : undefined;
  if (data.targetDate !== undefined) data.targetDate = toDateTime(data.targetDate as string | null) as unknown;
  if (data.dueDate !== undefined) data.dueDate = toDateTime(data.dueDate as string | null) as unknown;

  const objective = await objectiveService.getObjectiveById(id);
  if (!objective) {
    return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, objective.businessId);

  if (!can(user.data, 'task.update.any')) {
    return NextResponse.json({ error: 'Sin permisos para modificar objetivos' }, { status: 403 });
  }

  const validActions = ['complete', 'archive', undefined];
  if (_action !== undefined && !validActions.includes(_action)) {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  }

  let updated;
  switch (_action) {
    case 'complete':
      updated = await objectiveService.completeObjective(id);
      break;
    case 'archive':
      updated = await objectiveService.archiveObjective(id);
      break;
    default:
      updated = await objectiveService.updateObjective(id, data);
  }

<<<<<<< HEAD
  if (_action === 'complete' || _action === 'archive') {
    const labels: Record<string, string> = { complete: 'fue completado', archive: 'fue archivado' };
    const notifBody = `El objetivo "${objective.name}" ${labels[_action as string]}`;
    prisma.userBusiness.findMany({ where: { businessId: objective.businessId, isActive: true }, select: { userId: true } })
      .then((members) => {
        for (const m of members) {
          if (m.userId === user.uid) continue;
          sendNotification({ userId: m.userId, title: 'Objetivo actualizado', body: notifBody, type: 'info', link: '/dashboard/planificacion/objetivos' }).catch(() => {});
        }
      }).catch(() => {});
  }

=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'objective.update',
    targetType: 'OBJECTIVE',
    targetId: id,
    metadata: { _action, ...data },
  });

  return NextResponse.json(updated);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const objective = await objectiveService.getObjectiveById(id);
  if (!objective) {
    return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, objective.businessId);

  if (!can(user.data, 'task.delete')) {
    return NextResponse.json({ error: 'Sin permisos para eliminar objetivos' }, { status: 403 });
  }

  await objectiveService.deleteObjective(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'objective.delete',
    targetType: 'OBJECTIVE',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
});
