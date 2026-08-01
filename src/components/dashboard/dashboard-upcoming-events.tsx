'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpcomingEventsQuery } from '@/hooks/queries/use-calendar-events-query';
import type { CalendarEvent } from '@/types/domain/calendar';

const EVENTOS_HREF = '/dashboard/eventos';

function isPendingEvent(event: CalendarEvent, now: Date) {
  const end = new Date(event.end);
  return !Number.isNaN(end.getTime()) && end.getTime() >= now.getTime();
}

function formatNextHint(event: CalendarEvent) {
  const start = new Date(event.start);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const dayDiff = Math.round((startDay.getTime() - today.getTime()) / 86_400_000);
  if (dayDiff === 0) return 'Próximo: hoy';
  if (dayDiff === 1) return 'Próximo: mañana';
  return `Próximo: ${start.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`;
}

export function DashboardUpcomingEvents() {
  const router = useRouter();
  const { data: events = [], isPending } = useUpcomingEventsQuery(14);

  const { count, next } = useMemo(() => {
    const now = new Date();
    const pending = [...events]
      .filter((e) => isPendingEvent(e, now))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return { count: pending.length, next: pending[0] ?? null };
  }, [events]);

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={() => router.push(EVENTOS_HREF)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(EVENTOS_HREF);
        }
      }}
      className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="absolute top-0 right-0 p-4 opacity-30 dark:opacity-10 pointer-events-none">
        <CalendarDays className="h-12 w-12 text-violet-600" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Eventos pendientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-violet-600">
          {isPending && count === 0 ? '—' : count}
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {isPending && !next
            ? 'Cargando…'
            : next
              ? formatNextHint(next)
              : 'Nada pendiente'}
        </p>
      </CardContent>
    </Card>
  );
}
