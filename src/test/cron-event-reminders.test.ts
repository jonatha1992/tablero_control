import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { MailService } from '@/services/mail.service';

vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(),
}));

vi.mock('@/services/mail.service', () => ({
  MailService: {
    sendEventReminderEmail: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/prisma')>();
  return {
    ...original,
    prisma: {
      ...(original.prisma as object),
      calendarEvent: {
        findMany: vi.fn(),
      },
      user: {
        ...(original.prisma.user as object),
        findMany: vi.fn(),
      },
    },
  };
});

const mockCalendarEventFindMany = vi.mocked(prisma.calendarEvent.findMany);
const mockUserFindMany = vi.mocked(prisma.user.findMany);
const mockSendNotification = vi.mocked(sendNotification);
const mockSendEventReminderEmail = vi.mocked(MailService.sendEventReminderEmail);

describe('GET /api/cron/event-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T11:00:00.000Z'));
    process.env.CRON_SECRET = 'test-secret';
    mockSendEventReminderEmail.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.CRON_SECRET;
  });

  it('retorna 401 si el header Authorization no coincide con CRON_SECRET', async () => {
    const { GET } = await import('@/app/api/cron/event-reminders/route');
    const req = new NextRequest('http://localhost/api/cron/event-reminders');

    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(mockCalendarEventFindMany).not.toHaveBeenCalled();
  });

  it('envia notificacion y email a los asignados para eventos de hoy', async () => {
    const { GET } = await import('@/app/api/cron/event-reminders/route');

    mockCalendarEventFindMany
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          id: 'evt-1',
          businessId: 'biz-1',
          creatorId: 'creator-1',
          title: 'Demo cliente',
          description: null,
          start: new Date('2026-07-19T15:00:00.000Z'),
          end: new Date('2026-07-19T16:00:00.000Z'),
          allDay: false,
          color: null,
          assigneeIds: ['user-1', 'user-2'],
          reminders: [
            { type: 'notification', minutesBefore: 0 },
            { type: 'email', minutesBefore: 0 },
          ],
          recurrence: null,
          createdAt: new Date('2026-07-10T10:00:00.000Z'),
          updatedAt: new Date('2026-07-10T10:00:00.000Z'),
        },
      ] as never)
      .mockResolvedValueOnce([] as never);

    mockUserFindMany.mockResolvedValueOnce([
      { id: 'user-1', email: 'ana@biz.com' },
      { id: 'user-2', email: 'bob@biz.com' },
    ] as never);

    const req = new NextRequest('http://localhost/api/cron/event-reminders', {
      headers: { Authorization: 'Bearer test-secret' },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      dueTomorrow: 0,
      dueToday: 1,
      justOverdue: 0,
      notificationsSent: 2,
      emailsSent: 2,
    });
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
    expect(mockSendNotification).toHaveBeenNthCalledWith(1, {
      userId: 'user-1',
      title: '📅 Evento hoy',
      body: 'Demo cliente',
      type: 'calendar_event_reminder',
      link: '/dashboard/eventos',
    });
    expect(mockSendEventReminderEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEventReminderEmail).toHaveBeenNthCalledWith(1, 'ana@biz.com', {
      eventTitle: 'Demo cliente',
      whenLabel: 'hoy',
      eventsUrl: expect.stringContaining('/dashboard/eventos'),
    });
  });

  it('usa creatorId y reminders vacios como fallback', async () => {
    const { GET } = await import('@/app/api/cron/event-reminders/route');

    mockCalendarEventFindMany
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          id: 'evt-2',
          businessId: 'biz-1',
          creatorId: 'creator-9',
          title: 'Visita vencida',
          description: null,
          start: new Date('2026-07-18T14:00:00.000Z'),
          end: new Date('2026-07-18T15:00:00.000Z'),
          allDay: false,
          color: null,
          assigneeIds: [],
          reminders: [],
          recurrence: null,
          createdAt: new Date('2026-07-10T10:00:00.000Z'),
          updatedAt: new Date('2026-07-10T10:00:00.000Z'),
        },
      ] as never);

    mockUserFindMany.mockResolvedValueOnce([
      { id: 'creator-9', email: 'creator@biz.com' },
    ] as never);

    const req = new NextRequest('http://localhost/api/cron/event-reminders', {
      headers: { Authorization: 'Bearer test-secret' },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      dueTomorrow: 0,
      dueToday: 0,
      justOverdue: 1,
      notificationsSent: 1,
      emailsSent: 1,
    });
    expect(mockSendNotification).toHaveBeenCalledWith({
      userId: 'creator-9',
      title: '📅 Evento pasó',
      body: 'Visita vencida',
      type: 'calendar_event_reminder',
      link: '/dashboard/eventos',
    });
    expect(mockSendEventReminderEmail).toHaveBeenCalledWith('creator@biz.com', {
      eventTitle: 'Visita vencida',
      whenLabel: 'pasó',
      eventsUrl: expect.stringContaining('/dashboard/eventos'),
    });
  });
});
