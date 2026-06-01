import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requireUser, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant, assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { getTaskBusinessId } from '@/lib/api/task-business';
import { taskToReplicateTemplate } from '@/lib/tasks/task-to-create-dto';
import type { CreateTaskDTO } from '@/types/dto/task.dto';

interface ReplicateBody {
  projectIds?: string[];
  template?: CreateTaskDTO;
  sourceTaskId?: string;
}

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  let body: ReplicateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const projectIds = body.projectIds?.filter(Boolean) ?? [];
  if (projectIds.length === 0) {
    return NextResponse.json({ error: 'projectIds_required' }, { status: 400 });
  }

  const effectiveBusinessId = user.businessId;
  if (!effectiveBusinessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }
  assertSameTenant(user.data, { businessId: effectiveBusinessId });

  let template: CreateTaskDTO;
  let subtaskTitles: string[] = [];

  if (body.sourceTaskId) {
    const source = await taskService.getTaskById(body.sourceTaskId);
    if (!source) {
      return NextResponse.json({ error: 'task_not_found' }, { status: 404 });
    }
    const sourceBusinessId = await getTaskBusinessId(body.sourceTaskId);
    assertResourceBelongsToBusiness(user.data, sourceBusinessId);
    template = taskToReplicateTemplate(source);
    const subtasks = await taskService.getSubtasks(body.sourceTaskId);
    subtaskTitles = subtasks.map((s) => s.title);
  } else if (body.template?.title?.trim()) {
    template = body.template;
  } else {
    return NextResponse.json({ error: 'template_or_source_required' }, { status: 400 });
  }

  try {
    await taskService.validateProjectIdsForBusiness(projectIds, effectiveBusinessId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
  }

  const effectiveCreatorId = user.uid;
  const created: Awaited<ReturnType<typeof taskService.createTask>>[] = [];

  for (const projectId of projectIds) {
    const task = await taskService.createTask(
      { ...template, projectId },
      effectiveCreatorId,
      effectiveBusinessId,
    );
    created.push(task);

    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: effectiveBusinessId,
      action: 'task.create',
      targetType: 'TASK',
      targetId: task.id,
      metadata: {
        title: task.title,
        replicatedFrom: body.sourceTaskId,
        projectId,
      },
    });

    for (const title of subtaskTitles) {
      const subtask = await taskService.createTask(
        {
          title,
          status: 'todo',
          priority: template.priority,
          type: 'task',
          assigneeIds: [],
          tags: [],
        },
        effectiveCreatorId,
        effectiveBusinessId,
      );
      await taskService.updateTask(subtask.id, { parentId: task.id, projectId: task.projectId });
    }
  }

  return NextResponse.json({ tasks: created, count: created.length }, { status: 201 });
});
