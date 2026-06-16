'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarEventsApi } from '@/lib/api/calendar-events';
import { calendarEventKeys } from '@/hooks/queries/use-calendar-events-query';
import { toast } from 'sonner';
import type { CreateCalendarEventDTO } from '@/types/domain/calendar';

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateCalendarEventDTO> }) =>
      calendarEventsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      toast.success('Evento actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar evento');
    },
  });
}
