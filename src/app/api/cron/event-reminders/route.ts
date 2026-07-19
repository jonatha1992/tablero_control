import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { handle } from '@/lib/api/route-handler';
import { MailService } from '@/services/mail.service';
import type { ReminderConfig } from '@/types/domain/calendar';

type ReminderBucket = {
  offsetDays: number;
  title: '📅 Evento mañana' | '📅 Evento hoy' | '📅 Evento pasó';
  whenLabel: 'mañana' | 'hoy' | 'pasó';
};

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret}`;
}

function dayBoundaries(offsetDays: number): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + offsetDays);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function hasReminderType(reminders: ReminderConfig[] | null | undefined, type: ReminderConfig['type']): boolean {
  if (!reminders || reminders.length === 0) return true;
  return reminders.some((reminder) => reminder.type === type);
}

function parseReminders(value: unknown): ReminderConfig[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is ReminderConfig => {
    if (!item || typeof item !== 'object') return false;
    const reminder = item as Partial<ReminderConfig>;
    return (
      (reminder.type === 'notification' || reminder.type === 'email') &&
      typeof reminder.minutesBefore === 'number'
    );
  });
}

export const GET = handle(async (req: NextRequest) => {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const buckets: ReminderBucket[] = [
    { offsetDays: 1, title: '📅 Evento mañana', whenLabel: 'mañana' },
    { offsetDays: 0, title: '📅 Evento hoy', whenLabel: 'hoy' },
    { offsetDays: -1, title: '📅 Evento pasó', whenLabel: 'pasó' },
  ];

  const [dueTomorrow, dueToday, justOverdue] = await Promise.all(
    buckets.map(({ offsetDays }) => {
      const { start, end } = dayBoundaries(offsetDays);
      return prisma.calendarEvent.findMany({
        where: {
          start: { gte: start, lte: end },
        },
      });
    }),
  );

  const eventsByBucket = [
    { events: dueTomorrow, bucket: buckets[0] },
    { events: dueToday, bucket: buckets[1] },
    { events: justOverdue, bucket: buckets[2] },
  ];

  const recipientIds = Array.from(new Set(
    eventsByBucket.flatMap(({ events }) =>
      events.flatMap((event) => (event.assigneeIds.length > 0 ? event.assigneeIds : [event.creatorId])),
    ),
  ));

  const recipients = recipientIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: recipientIds }, isActive: true },
        select: { id: true, email: true },
      })
    : [];

  const recipientsById = new Map(recipients.map((recipient) => [recipient.id, recipient]));
  const eventsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/eventos`;

  let notificationsSent = 0;
  let emailsSent = 0;

  for (const { events, bucket } of eventsByBucket) {
    for (const event of events) {
      const targetIds = event.assigneeIds.length > 0 ? event.assigneeIds : [event.creatorId];
      const reminders = parseReminders(event.reminders);

      if (hasReminderType(reminders, 'notification')) {
        await Promise.all(
          targetIds.map(async (userId) => {
            if (!recipientsById.has(userId)) return;
            await sendNotification({
              userId,
              title: bucket.title,
              body: event.title,
              type: 'calendar_event_reminder',
              link: '/dashboard/eventos',
            });
            notificationsSent++;
          }),
        );
      }

      if (hasReminderType(reminders, 'email')) {
        await Promise.all(
          targetIds.map(async (userId) => {
            const recipient = recipientsById.get(userId);
            if (!recipient?.email) return;
            const result = await MailService.sendEventReminderEmail(recipient.email, {
              eventTitle: event.title,
              whenLabel: bucket.whenLabel,
              eventsUrl,
            });
            if (result.success) emailsSent++;
          }),
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dueTomorrow: dueTomorrow.length,
    dueToday: dueToday.length,
    justOverdue: justOverdue.length,
    notificationsSent,
    emailsSent,
  });
});
