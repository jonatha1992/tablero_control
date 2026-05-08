import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { handle } from '@/lib/api/route-handler';

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

const ACTIVE_STATUSES = ['backlog', 'todo', 'in_progress', 'in_review'] as const;

export const GET = handle(async (req: NextRequest) => {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = dayBoundaries(0);
  const tomorrow = dayBoundaries(1);
  const yesterday = dayBoundaries(-1);

  const taskInclude = {
    assignees: { select: { id: true } },
  } as const;

  const [dueTomorrow, dueToday, justOverdue] = await Promise.all([
    prisma.task.findMany({
      where: {
        dueDate: { gte: tomorrow.start, lte: tomorrow.end },
        status: { in: [...ACTIVE_STATUSES] },
      },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: {
        dueDate: { gte: today.start, lte: today.end },
        status: { in: [...ACTIVE_STATUSES] },
      },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: {
        dueDate: { gte: yesterday.start, lte: yesterday.end },
        status: { in: [...ACTIVE_STATUSES] },
      },
      include: taskInclude,
    }),
  ]);

  type NotificationPayload = {
    userId: string;
    title: string;
    body: string;
    type: string;
    link: string;
  };

  const notifications: NotificationPayload[] = [
    ...dueTomorrow.flatMap((task) =>
      task.assignees.map((a) => ({
        userId: a.id,
        title: '⏰ Tarea vence mañana',
        body: task.title,
        type: 'task_updated',
        link: '/dashboard/tareas',
      })),
    ),
    ...dueToday.flatMap((task) =>
      task.assignees.map((a) => ({
        userId: a.id,
        title: '🔔 Tarea vence hoy',
        body: task.title,
        type: 'task_updated',
        link: '/dashboard/tareas',
      })),
    ),
    ...justOverdue.flatMap((task) =>
      task.assignees.map((a) => ({
        userId: a.id,
        title: '⚠️ Tarea vencida',
        body: task.title,
        type: 'task_updated',
        link: '/dashboard/tareas',
      })),
    ),
  ];

  await Promise.all(notifications.map((n) => sendNotification(n)));

  return NextResponse.json({
    ok: true,
    dueTomorrow: dueTomorrow.length,
    dueToday: dueToday.length,
    justOverdue: justOverdue.length,
    notificationsSent: notifications.length,
  });
});
