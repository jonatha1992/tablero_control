import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requireUser, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { can, assertResourceBelongsToBusiness } from '@/lib/permissions';
import { handle } from '@/lib/api/route-handler';
import { getTaskBusinessId, taskBelongsToBusiness } from '@/lib/api/task-business';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export const GET = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const task = await taskService.getTaskById(id);
  if (!task) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const businessId = await getTaskBusinessId(id);
  assertResourceBelongsToBusiness(user.data, businessId);

  const activeMembership = user.data.memberships?.find(
    (m) => m.businessId === businessId && m.isActive
  );
  const userLocationId = activeMembership?.locationId;
  if (userLocationId && user.role !== 'admin' && user.role !== 'superadmin') {
    if (task.locationId && task.locationId !== userLocationId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json(task);
});

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  const { id } = await params;
  const body = await request.json();
  const { _move, creatorId: _creatorId, ...data } = body;

  const businessId = await getTaskBusinessId(id);
  assertResourceBelongsToBusiness(user.data, businessId);

  const activeMembership = user.data.memberships?.find(
    (m) => m.businessId === businessId && m.isActive
  );
  const userLocationId = activeMembership?.locationId;
  const existingTask = await taskService.getTaskById(id);

  if (userLocationId && user.role !== 'admin' && user.role !== 'superadmin') {
    if (existingTask?.locationId && existingTask.locationId !== userLocationId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  // Permitir updates SOLO de adjuntos con permisos de attachments,
  // sin requerir task.update.* (ej: miembro puede subir adjuntos aunque no esté asignado).
  const updateKeys = Object.keys(data).filter((k) => (data as Record<string, unknown>)[k] !== undefined);
  const isAttachmentOnlyUpdate = updateKeys.length > 0 && updateKeys.every((k) => k === 'attachmentUrls');
  let attachmentOnlyAllowed = false;
  if (isAttachmentOnlyUpdate) {
    const prevUrls = existingTask?.attachmentUrls ?? [];
    const nextUrls = Array.isArray((data as { attachmentUrls?: unknown }).attachmentUrls)
      ? ((data as { attachmentUrls: string[] }).attachmentUrls ?? [])
      : [];
    const removed = prevUrls.filter((u) => !nextUrls.includes(u));
    const added = nextUrls.filter((u) => !prevUrls.includes(u));

    if (removed.length > 0) {
      attachmentOnlyAllowed = can(user.data, 'attachment.delete');
    } else if (added.length > 0) {
      attachmentOnlyAllowed = can(user.data, 'attachment.upload');
    } else {
      // no-op (same list), allow to avoid false negatives
      attachmentOnlyAllowed = true;
    }
  }

  if (!attachmentOnlyAllowed) {
    if (!can(user.data, 'task.update.any')) {
      const taskCheck = await prisma.task.findUnique({
        where: { id },
        select: { assignees: { select: { id: true } }, creatorId: true },
      });
      const assigneeIds = taskCheck?.assignees.map((a) => a.id) ?? [];
      if (!can(user.data, 'task.update.assigned', {
        assigneeIds,
        creatorId: taskCheck?.creatorId,
      })) {
        return NextResponse.json({ error: 'missing_permission' }, { status: 403 });
      }
    }
  }

  if (_move) {
    const nextTask = await taskService.moveTask(id, data.status);

    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: user.businessId,
      action: 'task.move',
      targetType: 'TASK',
      targetId: id,
      metadata: { status: data.status },
    });

    if (nextTask) {
      await writeAuditLog({
        actorId: user.uid,
        actorRole: user.role,
        businessId: user.businessId,
        action: 'task.create',
        targetType: 'TASK',
        targetId: nextTask.id,
        metadata: { recurring: true, parentId: id },
      });
    }

    prisma.task.findUnique({ where: { id }, select: { title: true, assignees: { select: { id: true } } } })
      .then((t) => {
        if (!t) return;
        const actorName = user.data.name ?? 'Un compañero';
        for (const a of t.assignees) {
          if (a.id === user.uid) continue;
          sendNotification({ userId: a.id, title: 'Tarea actualizada', body: `${actorName} movió "${t.title}" a ${data.status}`, type: 'task_updated', link: '/dashboard/tareas' }).catch(() => {});
        }
      }).catch(() => {});

    return NextResponse.json({ ok: true, nextTaskId: nextTask?.id });
  }

  if (data.locationId) {
    const loc = await prisma.location.findUnique({
      where: { id: data.locationId },
      select: { businessId: true },
    });
    if (!loc || loc.businessId !== user.businessId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  if (data.projectId) {
    const proj = await prisma.project.findUnique({ where: { id: data.projectId }, select: { businessId: true } });
    if (!proj || proj.businessId !== user.businessId)
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (data.cycleId) {
    const cycle = await prisma.cycle.findUnique({ where: { id: data.cycleId }, select: { businessId: true } });
    if (!cycle || cycle.businessId !== user.businessId)
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (data.objectiveId) {
    const obj = await prisma.objective.findUnique({ where: { id: data.objectiveId }, select: { businessId: true } });
    if (!obj || obj.businessId !== user.businessId)
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const prevTask = await taskService.getTaskById(id);
  const prevAssigneeIds = prevTask?.assigneeIds ?? [];

  const task = await taskService.updateTask(id, data);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'task.update',
    targetType: 'TASK',
    targetId: id,
    metadata: { ...data },
  });

  const newAssigneeIds = task.assigneeIds.filter((uid: string) => !prevAssigneeIds.includes(uid));
  if (newAssigneeIds.length > 0) {
    prisma.user.findMany({
      where: { id: { in: newAssigneeIds }, isActive: true },
      select: { id: true, email: true, preferences: true },
    }).then((assignees) => {
      const assignerName = user.data.name ?? user.data.email ?? 'Un compañero';
      for (const assignee of assignees) {
        if (assignee.id === user.uid) continue;
        const prefs = assignee.preferences as { notifications?: { email?: boolean } } | null;
        sendNotification({
          userId: assignee.id,
          title: 'Nueva tarea asignada',
          body: `${assignerName} te asignó la tarea "${task.title}"`,
          type: 'task_assigned',
          link: '/dashboard/tareas',
        }).catch(() => {});
        if (prefs?.notifications?.email !== false) {
          import('@/services/mail.service').then(({ MailService }) => {
            MailService.sendTaskAssignedEmail(assignee.email, task.title, assignerName)
              .catch((err: unknown) => console.error('[mail] task-assigned failed:', (err as Error)?.message ?? err));
          });
        }
      }
    }).catch((err: unknown) => console.error('[mail] findMany failed:', (err as Error)?.message ?? err));
  }

  if (data.status && prevTask) {
    const actorName = user.data.name ?? 'Un compañero';
    for (const uid of prevAssigneeIds) {
      if (uid === user.uid) continue;
      sendNotification({ userId: uid, title: 'Tarea actualizada', body: `${actorName} cambió el estado de "${task.title}"`, type: 'task_updated', link: '/dashboard/tareas' }).catch(() => {});
    }
  }

  return NextResponse.json(task);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  const { id } = await params;

  // Tenant guard: tasks don't store businessId directly; infer from relations.
  // Use the current user's business context so DELETE doesn't fail on tasks with mixed relations.
  if (!user.businessId) {
    return NextResponse.json({ error: 'forbidden', reason: 'no_business_context' }, { status: 403 });
  }
  const belongs = await taskBelongsToBusiness(id, user.businessId);
  if (!belongs) {
    // Keep consistent with other tenant-guard failures.
    // If we can't infer a businessId, return an explicit 404 (task not found/indeterminate).
    const inferred = await getTaskBusinessId(id);
    if (!inferred) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }
    // This will be surfaced as { reason: 'tenant_mismatch' } by the handle() wrapper.
    assertResourceBelongsToBusiness(user.data, inferred);
  }

  const activeMembership = user.data.memberships?.find(
    (m) => m.businessId === user.businessId && m.isActive
  );
  const userLocationId = activeMembership?.locationId;
  const deletedTask = await taskService.getTaskById(id);

  if (userLocationId && user.role !== 'admin' && user.role !== 'superadmin') {
    if (deletedTask?.locationId && deletedTask.locationId !== userLocationId) {
      return NextResponse.json({ error: 'forbidden', reason: 'wrong_location' }, { status: 403 });
    }
  }

  if (!can(user.data, 'task.delete')) {
    return NextResponse.json({ error: 'forbidden', reason: 'missing_permission' }, { status: 403 });
  }

  await taskService.deleteTask(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'task.delete',
    targetType: 'TASK',
    targetId: id,
  });

  if (deletedTask?.assigneeIds?.length) {
    const actorName = user.data.name ?? 'Un compañero';
    for (const uid of deletedTask.assigneeIds) {
      if (uid === user.uid) continue;
      sendNotification({ userId: uid, title: 'Tarea eliminada', body: `${actorName} eliminó la tarea "${deletedTask.title}"`, type: 'info', link: '/dashboard/tareas' }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
});
