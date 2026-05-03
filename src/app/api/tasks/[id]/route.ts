import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const task = await taskService.getTaskById(id);
  if (!task) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json(task);
});

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const body = await request.json();
  const { _move, ...data } = body;

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

    return NextResponse.json({ ok: true, nextTaskId: nextTask?.id });
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

  const newAssigneeIds = task.assigneeIds.filter((uid) => !prevAssigneeIds.includes(uid));
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
              .catch((err) => console.error('[mail] task-assigned failed:', err?.message ?? err));
          });
        }
      }
    }).catch((err) => console.error('[mail] findMany failed:', err?.message ?? err));
  }

  return NextResponse.json(task);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  await taskService.deleteTask(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'task.delete',
    targetType: 'TASK',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
});
