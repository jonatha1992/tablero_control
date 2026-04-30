import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import type { TaskFilters, TaskStatus, TaskPriority } from '@/types/domain/task';

export async function GET(request: NextRequest) {
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
  if (status) filters.status = status.split(',') as TaskStatus[];
  if (priority) filters.priority = priority.split(',') as TaskPriority[];

  try {
    if (creatorId && !businessId) {
      const tasks = await taskService.getTasksByCreator(creatorId, filters);
      return NextResponse.json(tasks);
    }
    const tasks = await taskService.getTasksByBusiness(businessId!, filters);
    return NextResponse.json(tasks);
  } catch (err) {
    console.error('[GET /api/tasks]', err);
    return NextResponse.json({ error: 'Error interno al obtener tareas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  try {
    const { dto, creatorId, businessId } = await request.json();
    const task = await taskService.createTask(dto, creatorId ?? user.uid, businessId ?? user.businessId);
    
    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: user.businessId,
      action: 'task.create',
      targetType: 'TASK',
      targetId: task.id,
      metadata: { title: task.title },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    return NextResponse.json({ error: 'Error al crear la tarea' }, { status: 500 });
  }
}

