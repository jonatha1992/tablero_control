import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requireUser, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import type { TaskFilters, TaskStatus, TaskPriority } from '@/types/domain/task';

function parseDateFilter(value: string | null, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    );
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

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
  const assigneeId = searchParams.get('assigneeId');
  const cycleId = searchParams.get('cycleId');
  const noCycle = searchParams.get('noCycle');
  const search = searchParams.get('search');
  const dueDateFrom = parseDateFilter(searchParams.get('dueDateFrom'));
  const dueDateTo = parseDateFilter(searchParams.get('dueDateTo'), true);
  const activeMembership = user.data.memberships?.find(
    (m) => m.businessId === businessId && m.isActive
  );
  const userLocationId = activeMembership?.locationId;

  const includeArchived = searchParams.get('includeArchived') === 'true';
  if (status) { const ids = status.split(',').filter(Boolean); if (ids.length) filters.status = ids as TaskStatus[]; }
  else if (!includeArchived) { filters.excludeStatus = ['archived']; }
  if (priority) { const ids = priority.split(',').filter(Boolean); if (ids.length) filters.priority = ids as TaskPriority[]; }
  if (projectId) { const ids = projectId.split(',').filter(Boolean); if (ids.length) filters.projectId = ids; }
  if (assigneeId) { const ids = assigneeId.split(',').filter(Boolean); if (ids.length) filters.assigneeId = ids; }
  
  // Sector-scoped users: su sector + tareas propias sin sector (p. ej. creadas por IA sin locationId)
  if (userLocationId && user.role !== 'admin' && user.role !== 'superadmin') {
    filters.locationOrCreator = { locationId: userLocationId, creatorId: user.uid };
  } else if (locationId) { 
    const ids = locationId.split(',').filter(Boolean); 
    if (ids.length) filters.locationId = ids; 
  }

  if (cycleId) { const ids = cycleId.split(',').filter(Boolean); if (ids.length) filters.cycleId = ids; }
  if (noCycle === 'true') filters.noCycle = true;
  if (dueDateFrom) filters.dueDateFrom = dueDateFrom;
  if (dueDateTo) filters.dueDateTo = dueDateTo;
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

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  let body: { dto: import('@/types/dto/task.dto').CreateTaskDTO; creatorId?: string; businessId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { dto, creatorId, businessId } = body;
  const effectiveBusinessId = businessId ?? user.businessId;
  if (!effectiveBusinessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }
  assertSameTenant(user.data, { businessId: effectiveBusinessId });

  // Ensure referenced resources belong to the same tenant (avoid cross-tenant tasks).
  if (dto.locationId) {
    const loc = await prisma.location.findUnique({ where: { id: dto.locationId }, select: { businessId: true } });
    if (!loc || loc.businessId !== effectiveBusinessId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }
  if (dto.projectId) {
    const proj = await prisma.project.findUnique({ where: { id: dto.projectId }, select: { businessId: true } });
    if (!proj || proj.businessId !== effectiveBusinessId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }
  if (dto.cycleId) {
    const cycle = await prisma.cycle.findUnique({ where: { id: dto.cycleId }, select: { businessId: true } });
    if (!cycle || cycle.businessId !== effectiveBusinessId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }
  if (dto.objectiveId) {
    const obj = await prisma.objective.findUnique({ where: { id: dto.objectiveId }, select: { businessId: true } });
    if (!obj || obj.businessId !== effectiveBusinessId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

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
        }).catch((err) => console.error('[notify-error]', err));
        // Email solo si tiene preferencia activa
        if (prefs?.notifications?.email !== false) {
          import('@/services/mail.service').then(({ MailService }) => {
            MailService.sendTaskAssignedEmail(assignee.email, task.title, assignerName).catch((err) => console.error('[mail-error]', err));
          });
        }
      }
    }).catch((err) => console.error('[notify-query-error]', err));
  }

  return NextResponse.json(task, { status: 201 });
});
