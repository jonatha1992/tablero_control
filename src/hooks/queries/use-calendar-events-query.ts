'use client';

import { useQuery } from '@tanstack/react-query';
import { calendarEventsApi } from '@/lib/api/calendar-events';
import { useAuth } from '@/hooks/auth-context';

export const calendarEventKeys = {
  all: ['calendar-events'] as const,
  range: (from?: string, to?: string) => [...calendarEventKeys.all, from, to] as const,
};

export function useCalendarEventsQuery(from?: Date, to?: Date) {
  const { user } = useAuth();
  return useQuery({
    queryKey: calendarEventKeys.range(from?.toISOString(), to?.toISOString()),
    queryFn: () => calendarEventsApi.list(from, to),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTodayEventsQuery() {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  return useCalendarEventsQuery(from, to);
}
