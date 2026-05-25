import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { getTaskBusinessId } from '@/lib/api/task-business';

export const GET = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const businessId = await getTaskBusinessId(id);
  assertResourceBelongsToBusiness(user.data, businessId);

  const subtasks = await taskService.getSubtasks(id);
  return NextResponse.json(subtasks);
});

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id: parentId } = await params;
  const { title } = await request.json();

  const parent = await taskService.getTaskById(parentId);
  if (!parent) {
    return NextResponse.json({ error: 'Tarea padre no encontrada' }, { status: 404 });
  }

  const businessId = await getTaskBusinessId(parentId);
  assertResourceBelongsToBusiness(user.data, businessId);

  const subtask = await taskService.createTask(
    {
      title,
      status: 'todo',
      priority: parent.priority,
      type: 'task',
      assigneeIds: [],
      tags: [],
    },
    user.uid,
    user.businessId ?? ''
  );

  await taskService.updateTask(subtask.id, { parentId });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'task.create',
    targetType: 'TASK',
    targetId: subtask.id,
    metadata: { parentId, title, isSubtask: true },
  });

  return NextResponse.json(subtask, { status: 201 });
});
