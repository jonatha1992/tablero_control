import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import type { TaskFilters, TaskStatus, TaskPriority } from '@/types/domain/task';

export const GET = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  const creatorId = searchParams.get('creatorId');

  if (!businessId && !creatorId) {
    return NextResponse.json({ error: 'businessId o creatorId requerido' }, { status: 400 });
  }

  // Reject 'all' — superadmin must use their own businessId
  if (businessId === 'all') {
    return NextResponse.json({ error: 'businessId inválido' }, { status: 400 });
  }

  const filters: TaskFilters = {};
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const projectId = searchParams.get('projectId');
  const locationId = searchParams.get('locationId');
  const cycleId = searchParams.get('cycleId');
  const noCycle = searchParams.get('noCycle');
  const search = searchParams.get('search');
  if (status) filters.status = status.split(',') as TaskStatus[];
  if (priority) filters.priority = priority.split(',') as TaskPriority[];
  if (projectId) filters.projectId = projectId.split(',');
  if (locationId) filters.locationId = locationId.split(',');
  if (cycleId) { const ids = cycleId.split(',').filter(Boolean); if (ids.length) filters.cycleId = ids; }
  if (noCycle === 'true') filters.noCycle = true;
  if (search) filters.search = search;

  if (creatorId && !businessId) {
    // Verify the creator belongs to the same tenant
    const creator = await prisma.user.findUnique({ where: { id: creatorId }, select: { businessId: true } });
    if (!creator?.businessId) {
      return NextResponse.json({ error: 'creator_not_found' }, { status: 404 });
    }
    assertSameTenant(user.data, { businessId: creator.businessId });
    const tasks = await taskService.getTasksByCreator(creatorId, filters);
    return NextResponse.json(tasks);
  }
  assertSameTenant(user.data, { businessId: businessId! });

  const tasks = await taskService.getTasksByBusiness(businessId!, filters);
  return NextResponse.json(tasks);
});

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { dto, creatorId, businessId } = await request.json();
  const effectiveBusinessId = businessId ?? user.businessId;
  if (!effectiveBusinessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }
  assertSameTenant(user.data, { businessId: effectiveBusinessId });
  const effectiveCreatorId =
    creatorId && (user.role === 'superadmin' || user.role === 'admin')
      ? creatorId
      : user.uid;
  const task = await taskService.createTask(dto, effectiveCreatorId, effectiveBusinessId);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'task.create',
    targetType: 'TASK',
    targetId: task.id,
    metadata: { title: task.title },
  });

  if (task.assigneeIds?.length > 0) {
    prisma.user.findMany({
      where: { id: { in: task.assigneeIds }, isActive: true },
      select: { id: true, email: true, preferences: true },
    }).then((assignees) => {
      const assignerName = user.data.name ?? user.data.email ?? 'Un compañero';
      for (const assignee of assignees) {
        if (assignee.id === user.uid) continue; // no notificar al que asigna
        const prefs = assignee.preferences as { notifications?: { email?: boolean } } | null;
        // Notificación interna + push
        sendNotification({
          userId: assignee.id,
          title: 'Nueva tarea asignada',
          body: `${assignerName} te asignó la tarea "${task.title}"`,
          type: 'task_assigned',
          link: '/dashboard/tareas',
        }).catch(() => {});
        // Email solo si tiene preferencia activa
        if (prefs?.notifications?.email !== false) {
          import('@/services/mail.service').then(({ MailService }) => {
            MailService.sendTaskAssignedEmail(assignee.email, task.title, assignerName).catch(() => {});
          });
        }
      }
    }).catch(() => {});
  }

  return NextResponse.json(task, { status: 201 });
});
