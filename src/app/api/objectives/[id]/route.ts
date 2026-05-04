import { NextRequest, NextResponse } from 'next/server';
import { objectiveService } from '@/services/objective.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const objective = await objectiveService.getObjectiveById(id);
  if (!objective) {
    return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
  }
  return NextResponse.json(objective);
});

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const body = await request.json();
  const { _action, ...data } = body;

  let objective;
  switch (_action) {
    case 'complete':
      objective = await objectiveService.completeObjective(id);
      break;
    case 'archive':
      objective = await objectiveService.archiveObjective(id);
      break;
    default:
      objective = await objectiveService.updateObjective(id, data);
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

  return NextResponse.json(objective);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
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
