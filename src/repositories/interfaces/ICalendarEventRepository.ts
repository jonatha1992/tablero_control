import type { CalendarEvent, CreateCalendarEventDTO } from '@/types/domain/calendar';

export interface ICalendarEventRepository {
  findByBusiness(businessId: string, from?: Date, to?: Date): Promise<CalendarEvent[]>;
  findById(id: string): Promise<CalendarEvent | null>;
  create(data: CreateCalendarEventDTO, businessId: string, creatorId: string): Promise<CalendarEvent>;
  update(id: string, data: Partial<CreateCalendarEventDTO>): Promise<CalendarEvent>;
  delete(id: string): Promise<void>;
}
