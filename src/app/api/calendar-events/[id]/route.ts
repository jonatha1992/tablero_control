import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { calendarEventRepository } from '@/repositories/index';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const event = await calendarEventRepository.findById(id);
  if (!event) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (event.businessId !== user.businessId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await request.json();
  const updated = await calendarEventRepository.update(id, {
    ...body,
    start: body.start ? new Date(body.start) : undefined,
    end: body.end ? new Date(body.end) : undefined,
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'calendar_event.update',
    targetType: 'CALENDAR_EVENT',
    targetId: id,
    metadata: body,
  });

  return NextResponse.json(updated);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const event = await calendarEventRepository.findById(id);
  if (!event) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (event.businessId !== user.businessId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await calendarEventRepository.delete(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'calendar_event.delete',
    targetType: 'CALENDAR_EVENT',
    targetId: id,
    metadata: { title: event.title },
  });

  return NextResponse.json({ ok: true });
});
