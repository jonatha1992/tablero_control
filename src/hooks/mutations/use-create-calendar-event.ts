'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarEventsApi } from '@/lib/api/calendar-events';
import { calendarEventKeys } from '@/hooks/queries/use-calendar-events-query';
import type { CreateCalendarEventDTO, ReminderConfig } from '@/types/domain/calendar';
import { toast } from 'sonner';

const DEFAULT_EVENT_REMINDERS: ReminderConfig[] = [
  { type: 'notification', minutesBefore: 0 },
  { type: 'email', minutesBefore: 0 },
];

interface UseCreateCalendarEventOptions {
  successMessage?: string | null;
  errorMessage?: string | null;
}

export function withDefaultEventReminders(dto: CreateCalendarEventDTO): CreateCalendarEventDTO {
  return {
    ...dto,
    reminders: dto.reminders?.length ? dto.reminders : [...DEFAULT_EVENT_REMINDERS],
  };
}

export function useCreateCalendarEvent(options: UseCreateCalendarEventOptions = {}) {
  const { successMessage = 'Evento creado', errorMessage = 'Error al crear evento' } = options;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCalendarEventDTO) =>
      calendarEventsApi.create(withDefaultEventReminders(dto)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      if (successMessage) {
        toast.success(successMessage, {
          description: 'Aviso por notificación y mail el día del evento.',
          action: {
            label: 'Ver eventos',
            onClick: () => {
              window.location.assign('/dashboard/eventos');
            },
          },
        });
      }
    },
    onError: () => {
      if (errorMessage) {
        toast.error(errorMessage);
      }
    },
  });
}
