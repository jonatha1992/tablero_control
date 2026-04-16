import type { RecurrenceConfig } from './task';

export interface ReminderConfig {
  type: 'notification' | 'email';
  minutesBefore: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  taskId?: string;
  projectId?: string;
  assigneeIds: string[];
  color?: string;
  recurrence?: RecurrenceConfig;
  reminders: ReminderConfig[];
}
