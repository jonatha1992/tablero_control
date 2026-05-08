import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { calendarEventRepository } from '@/repositories/index';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

  const events = await calendarEventRepository.findByBusiness(user.businessId!, from, to);
  return NextResponse.json(events);
});

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const event = await calendarEventRepository.create(
    {
      ...body,
      start: new Date(body.start),
      end: new Date(body.end),
    },
    user.businessId!,
    user.uid,
  );

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'calendar_event.create',
    targetType: 'CALENDAR_EVENT',
    targetId: event.id,
    metadata: { title: event.title },
  });

  return NextResponse.json(event, { status: 201 });
});
