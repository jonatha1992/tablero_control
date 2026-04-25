import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await taskService.getTaskById(id);
  if (!task) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      action: 'UPDATE',
      targetType: 'TASK',
      targetId: id,
      metadata: { move: true, status: data.status },
    });

    if (nextTask) {
      await writeAuditLog({
        actorId: 'system',
        actorRole: 'system',
        businessId: user.businessId,
        action: 'CREATE',
        targetType: 'TASK',
        targetId: nextTask.id,
        metadata: { recurring: true, parentId: id },
      });
    }

    return NextResponse.json({ ok: true, nextTaskId: nextTask?.id });
  }

  const task = await taskService.updateTask(id, data);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'UPDATE',
    targetType: 'TASK',
    targetId: id,
    metadata: { ...data },
  });

  return NextResponse.json(task);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  await taskService.deleteTask(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'DELETE',
    targetType: 'TASK',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
