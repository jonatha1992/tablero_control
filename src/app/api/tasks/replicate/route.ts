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
  locationIds?: string[];
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
  const locationIds = body.locationIds?.filter(Boolean) ?? [];
  if (projectIds.length === 0 && locationIds.length === 0) {
    return NextResponse.json({ error: 'targets_required' }, { status: 400 });
  }

  const effectiveBusinessId = user.businessId;
  if (!effectiveBusinessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }
  assertSameTenant(user.data, { businessId: effectiveBusinessId });

  let template: CreateTaskDTO;

  if (body.sourceTaskId) {
    const source = await taskService.getTaskById(body.sourceTaskId);
    if (!source) {
      return NextResponse.json({ error: 'task_not_found' }, { status: 404 });
    }
    const sourceBusinessId = await getTaskBusinessId(body.sourceTaskId);
    if (!sourceBusinessId) {
      return NextResponse.json({ error: 'task_not_found' }, { status: 404 });
    }
    assertResourceBelongsToBusiness(user.data, sourceBusinessId);
    template = taskToReplicateTemplate(source);
  } else if (body.template?.title?.trim()) {
    template = body.template;
  } else {
    return NextResponse.json({ error: 'template_or_source_required' }, { status: 400 });
  }

  if (projectIds.length > 0) {
    try {
      await taskService.validateProjectIdsForBusiness(projectIds, effectiveBusinessId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'forbidden') {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
    }
  }

  if (locationIds.length > 0) {
    try {
      await taskService.validateLocationIdsForBusiness(locationIds, effectiveBusinessId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'forbidden') {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'location_not_found' }, { status: 404 });
    }
  }

  const effectiveCreatorId = user.uid;
  const created: Awaited<ReturnType<typeof taskService.createTask>>[] = [];

  const targets =
    projectIds.length > 0
      ? projectIds.map((projectId) => ({ projectId, locationId: template.locationId }))
      : locationIds.map((locationId) => ({ projectId: template.projectId, locationId }));

  for (const target of targets) {
    const task = await taskService.createTask(
      { ...template, projectId: target.projectId, locationId: target.locationId },
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
        projectId: target.projectId,
        locationId: target.locationId,
      },
    });

  }

  return NextResponse.json({ tasks: created, count: created.length }, { status: 201 });
});
