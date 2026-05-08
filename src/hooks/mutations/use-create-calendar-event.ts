'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarEventsApi } from '@/lib/api/calendar-events';
import { calendarEventKeys } from '@/hooks/queries/use-calendar-events-query';
import { toast } from 'sonner';

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: calendarEventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      toast.success('Evento creado');
    },
    onError: () => {
      toast.error('Error al crear evento');
    },
  });
}
