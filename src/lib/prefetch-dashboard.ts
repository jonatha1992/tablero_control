'use client';

import type { QueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { calendarEventsApi } from '@/lib/api/calendar-events';
import { projectsApi } from '@/lib/api/projects';
import { locationsApi } from '@/lib/api/locations';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import { calendarEventKeys, getUpcomingEventsRange } from '@/hooks/queries/use-calendar-events-query';
import { projectKeys } from '@/hooks/queries/use-projects-query';
import { locationKeys } from '@/hooks/queries/use-locations-query';

export interface PrefetchAuthContext {
  businessId?: string | null;
  userId?: string | null;
  isSuperAdmin?: boolean;
}

/** Warm React Query cache on sidebar hover so module switches paint with data. */
export function prefetchDashboardRoute(
  queryClient: QueryClient,
  href: string,
  ctx: PrefetchAuthContext,
): void {
  const businessId = ctx.isSuperAdmin
    ? (ctx.businessId ?? 'all')
    : (ctx.businessId ?? null);
  const taskCacheKey = businessId ?? (ctx.userId ? `creator:${ctx.userId}` : null);

  const needsTasks =
    href === '/dashboard' ||
    href.startsWith('/dashboard/tareas') ||
    href.startsWith('/dashboard/reportes') ||
    href.startsWith('/dashboard/equipo');

  const needsCalendarEvents =
    href === '/dashboard' ||
    href.startsWith('/dashboard/eventos') ||
    href.startsWith('/dashboard/tareas/calendario') ||
    href.startsWith('/dashboard/tareas/agenda');

  if (needsTasks && taskCacheKey && ctx.userId) {
    void queryClient.prefetchQuery({
      queryKey: taskKeys.byBusiness(taskCacheKey),
      queryFn: ({ signal }) => {
        if (businessId && businessId !== 'all') {
          return tasksApi.getByBusiness(businessId, signal);
        }
        return tasksApi.getByCreator(ctx.userId!, signal);
      },
      staleTime: 1000 * 60 * 5,
    });
  }

  if (needsCalendarEvents && ctx.businessId) {
    void queryClient.prefetchQuery({
      queryKey: calendarEventKeys.range(undefined, undefined),
      queryFn: () => calendarEventsApi.list(),
      staleTime: 1000 * 60 * 5,
    });

    if (href === '/dashboard') {
      const { from, to } = getUpcomingEventsRange(14);
      void queryClient.prefetchQuery({
        queryKey: calendarEventKeys.range(from.toISOString(), to.toISOString()),
        queryFn: () => calendarEventsApi.list(from, to),
        staleTime: 1000 * 60 * 5,
      });
    }

    if (href.startsWith('/dashboard/tareas/calendario')) {
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      from.setDate(1);
      const to = new Date();
      to.setMonth(to.getMonth() + 2);
      to.setDate(0);
      void queryClient.prefetchQuery({
        queryKey: calendarEventKeys.range(from.toISOString(), to.toISOString()),
        queryFn: () => calendarEventsApi.list(from, to),
        staleTime: 1000 * 60 * 5,
      });
    }
  }

  if (
    (href.startsWith('/dashboard/tareas') || href.startsWith('/dashboard/eventos')) &&
    ctx.businessId
  ) {
    void queryClient.prefetchQuery({
      queryKey: projectKeys.byBusiness(ctx.businessId),
      queryFn: () => projectsApi.getByBusiness(ctx.businessId!),
      staleTime: 1000 * 60 * 5,
    });
    void queryClient.prefetchQuery({
      queryKey: locationKeys.byBusiness(ctx.businessId),
      queryFn: () => locationsApi.getByBusiness(ctx.businessId!),
      staleTime: 1000 * 60 * 15,
    });
  }
}
