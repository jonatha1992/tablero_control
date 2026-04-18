import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await taskService.getTaskById(id);
  if (!task) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { _move, ...data } = body;

  if (_move) {
    await taskService.moveTask(id, data.status);
    return NextResponse.json({ ok: true });
  }

  const task = await taskService.updateTask(id, data);
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await taskService.deleteTask(id);
  return NextResponse.json({ ok: true });
}
