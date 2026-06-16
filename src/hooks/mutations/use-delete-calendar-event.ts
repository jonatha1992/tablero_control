'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarEventsApi } from '@/lib/api/calendar-events';
import { calendarEventKeys } from '@/hooks/queries/use-calendar-events-query';
import { toast } from 'sonner';

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarEventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      toast.success('Evento eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar evento');
    },
  });
}
