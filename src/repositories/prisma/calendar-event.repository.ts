import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { ICalendarEventRepository } from '../interfaces/ICalendarEventRepository';
import type { CalendarEvent, CreateCalendarEventDTO, ReminderConfig } from '@/types/domain/calendar';
import type { RecurrenceConfig } from '@/types/domain/task';

type PrismaCalendarEvent = Prisma.CalendarEventGetPayload<Record<string, never>>;

function toDomain(e: PrismaCalendarEvent): CalendarEvent {
  return {
    id: e.id,
    businessId: e.businessId,
    creatorId: e.creatorId,
    title: e.title,
    description: e.description ?? undefined,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    assigneeIds: e.assigneeIds,
    color: e.color ?? undefined,
    recurrence: e.recurrence ? (e.recurrence as unknown as RecurrenceConfig) : undefined,
    reminders: (e.reminders as unknown as ReminderConfig[]) ?? [],
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

export class PrismaCalendarEventRepository implements ICalendarEventRepository {
  async findByBusiness(businessId: string, from?: Date, to?: Date): Promise<CalendarEvent[]> {
    const where: Prisma.CalendarEventWhereInput = { businessId };
    if (from || to) {
      where.OR = [
        { start: { gte: from, lte: to } },
        { end: { gte: from, lte: to } },
      ];
    }
    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { start: 'asc' },
    });
    return events.map(toDomain);
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    const e = await prisma.calendarEvent.findUnique({ where: { id } });
    return e ? toDomain(e) : null;
  }

  async create(data: CreateCalendarEventDTO, businessId: string, creatorId: string): Promise<CalendarEvent> {
    const e = await prisma.calendarEvent.create({
      data: {
        businessId,
        creatorId,
        title: data.title,
        description: data.description,
        start: data.start,
        end: data.end,
        allDay: data.allDay ?? false,
        assigneeIds: data.assigneeIds ?? [],
        color: data.color,
        recurrence: data.recurrence ? (data.recurrence as unknown as Prisma.InputJsonValue) : undefined,
        reminders: (data.reminders ?? []) as unknown as Prisma.InputJsonValue,
      },
    });
    return toDomain(e);
  }

  async update(id: string, data: Partial<CreateCalendarEventDTO>): Promise<CalendarEvent> {
    const e = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...data,
        recurrence: data.recurrence !== undefined
          ? (data.recurrence as unknown as Prisma.InputJsonValue)
          : undefined,
        reminders: data.reminders !== undefined
          ? (data.reminders as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
    return toDomain(e);
  }

  async delete(id: string): Promise<void> {
    await prisma.calendarEvent.delete({ where: { id } });
  }
}
