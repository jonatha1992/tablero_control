import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import type { TaskFilters } from '@/types/domain/task';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

  const filters: TaskFilters = {};
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  if (status) filters.status = status.split(',') as TaskStatus[];
  if (priority) filters.priority = priority.split(',') as TaskPriority[];

  const tasks = await taskService.getTasksByBusiness(businessId, filters);
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const { dto, creatorId, businessId } = await request.json();
  const task = await taskService.createTask(dto, creatorId, businessId);
  return NextResponse.json(task, { status: 201 });
}
