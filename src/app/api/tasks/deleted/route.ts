import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { handle } from '@/lib/api/route-handler';
import { taskService } from '@/services/task.service';
import { writeAuditLog } from '@/lib/api/audit';
import { can } from '@/lib/permissions/matrix';

/**
 * GET /api/tasks/deleted — listar tareas eliminadas (soft-deleted) del business.
 * Solo admin/superadmin.
 */
export const GET = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  if (!user.businessId) {
    return NextResponse.json({ error: 'no_business' }, { status: 403 });
  }

  if (!can(user.data, 'task.delete')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const tasks = await taskService.getDeletedTasks(user.businessId);
  return NextResponse.json(tasks);
});

/**
 * POST /api/tasks/deleted — restore or hard-delete.
 * Body: { taskId: string, action: 'restore' | 'hard_delete' }
 */
export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  if (!can(user.data, 'task.delete')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { taskId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { taskId, action } = body;
  if (!taskId || !action) {
    return NextResponse.json({ error: 'taskId and action required' }, { status: 400 });
  }

  if (action === 'restore') {
    await taskService.restoreTask(taskId);
    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: user.businessId,
      action: 'task.restore',
      targetType: 'TASK',
      targetId: taskId,
    });
    return NextResponse.json({ ok: true, action: 'restored' });
  }

  if (action === 'hard_delete') {
    await taskService.hardDeleteTask(taskId);
    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: user.businessId,
      action: 'task.hard_delete',
      targetType: 'TASK',
      targetId: taskId,
    });
    return NextResponse.json({ ok: true, action: 'hard_deleted' });
  }

  return NextResponse.json({ error: 'action must be restore or hard_delete' }, { status: 400 });
});
