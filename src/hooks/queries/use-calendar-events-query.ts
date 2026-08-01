'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calendarEventsApi } from '@/lib/api/calendar-events';
import { useAuth } from '@/hooks/auth-context';

export const calendarEventKeys = {
  all: ['calendar-events'] as const,
  range: (from?: string, to?: string) => [...calendarEventKeys.all, from, to] as const,
};

/** Stable day-bounded range so prefetch and page share the same query key. */
export function getUpcomingEventsRange(daysAhead = 14): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + daysAhead);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

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

export function useUpcomingEventsQuery(daysAhead = 14) {
  const dayKey = new Date().toDateString();
  const { from, to } = useMemo(
    () => getUpcomingEventsRange(daysAhead),
    [daysAhead, dayKey],
  );
  return useCalendarEventsQuery(from, to);
}
