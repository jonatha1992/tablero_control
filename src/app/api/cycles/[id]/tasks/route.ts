import { NextRequest, NextResponse } from 'next/server';
import { cycleService } from '@/services/cycle.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id: cycleId } = await params;
  const { taskIds, action } = await request.json();

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
