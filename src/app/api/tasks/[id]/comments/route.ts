import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/services/comment.service';
import { taskService } from '@/services/task.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { sendNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';

async function getTaskBusinessId(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      project: { select: { businessId: true } },
      location: { select: { businessId: true } },
      creator: { select: { businessId: true } },
    },
  });
  return task?.project?.businessId ?? task?.location?.businessId ?? task?.creator?.businessId ?? null;
}

export const GET = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id: taskId } = await params;
  const businessId = await getTaskBusinessId(taskId);
  assertResourceBelongsToBusiness(user.data, businessId);

  const comments = await commentService.getCommentsByTask(taskId);
  return NextResponse.json(comments);
});

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id: taskId } = await params;
  const { content, attachments } = await request.json();

  const task = await taskService.getTaskById(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
  }

  const businessId = await getTaskBusinessId(taskId);
  assertResourceBelongsToBusiness(user.data, businessId);

  const comment = await commentService.addComment({
    taskId,
    authorId: user.uid,
    content,
    attachments,
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'comment.create',
    targetType: 'COMMENT',
    targetId: comment.id,
    metadata: { taskId, taskTitle: task.title },
  });

  // Notificar a los asignados de la tarea (excepto al autor del comentario)
  if (task.assigneeIds?.length > 0) {
    prisma.user.findMany({
      where: { id: { in: task.assigneeIds }, isActive: true },
      select: { id: true, email: true, preferences: true },
    }).then((assignees) => {
      const authorName = user.data.name ?? user.data.email ?? 'Un compañero';
      for (const assignee of assignees) {
        if (assignee.id === user.uid) continue;
        sendNotification({
          userId: assignee.id,
          title: 'Nuevo comentario en tarea',
          body: `${authorName} comentó en "${task.title}"`,
          type: 'task_updated',
          link: `/dashboard/tareas`,
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  return NextResponse.json(comment, { status: 201 });
});
