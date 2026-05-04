import { NextRequest, NextResponse } from 'next/server';
import { timeEntryService } from '@/services/time-entry.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: taskId } = await params;
  const entries = await timeEntryService.getByTask(taskId);
  return NextResponse.json(entries);
});

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id: taskId } = await params;
  const body = await request.json();

  if (!body.hours || typeof body.hours !== 'number' || body.hours <= 0) {
    return NextResponse.json({ error: 'hours requerido y debe ser mayor a 0' }, { status: 400 });
  }

  const entry = await timeEntryService.create({
    taskId,
    userId: user.uid,
    hours: body.hours,
    date: body.date ? new Date(body.date) : undefined,
    note: body.note,
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'time_entry.create' as any,
    targetType: 'TIME_ENTRY',
    targetId: entry.id,
    metadata: { taskId, hours: body.hours },
  });

  return NextResponse.json(entry, { status: 201 });
});
