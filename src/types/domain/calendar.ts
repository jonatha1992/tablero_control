import type { RecurrenceConfig } from './task';

export interface ReminderConfig {
  type: 'notification' | 'email';
  minutesBefore: number;
}

export interface CalendarEvent {
  id: string;
  businessId: string;
  creatorId: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  assigneeIds: string[];
  color?: string;
  recurrence?: RecurrenceConfig;
  reminders: ReminderConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCalendarEventDTO {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  assigneeIds?: string[];
  color?: string;
  recurrence?: RecurrenceConfig;
  reminders?: ReminderConfig[];
}
