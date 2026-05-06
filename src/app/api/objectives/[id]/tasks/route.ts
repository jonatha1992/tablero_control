import { NextRequest, NextResponse } from 'next/server';
import { objectiveService } from '@/services/objective.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id: objectiveId } = await params;
  const { taskIds, action } = await request.json();

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
