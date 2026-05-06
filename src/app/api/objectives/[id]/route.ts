import { NextRequest, NextResponse } from 'next/server';
import { objectiveService } from '@/services/objective.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';

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

  const objective = await objectiveService.getObjectiveById(id);
  if (!objective) {
    return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, objective.businessId);

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
