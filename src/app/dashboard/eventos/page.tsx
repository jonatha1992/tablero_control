'use client';

import { useState } from 'react';
import { useCalendarEventsQuery } from '@/hooks/queries/use-calendar-events-query';
import { CreateEventModal } from '@/components/tareas/create-event-modal';
import { CalendarEventSheet } from '@/components/calendario/calendar-event-sheet';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, Clock, Trash2 } from 'lucide-react';
import { useDeleteCalendarEvent } from '@/hooks/mutations/use-delete-calendar-event';
import type { CalendarEvent } from '@/types/domain/calendar';
import { NAV_ICON_COLORS } from '@/lib/constants/ui-icon-colors';
import { cn } from '@/lib/utils';

function formatEventDate(event: CalendarEvent) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  if (event.allDay) return start.toLocaleDateString('es-AR', opts);
  const time = (d: Date) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${start.toLocaleDateString('es-AR', opts)} · ${time(start)} → ${time(end)}`;
}

function groupByDate(events: CalendarEvent[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const groups: { label: string; events: CalendarEvent[] }[] = [];
  const upcoming = events.filter((e) => new Date(e.end) >= todayStart);
  const past = events.filter((e) => new Date(e.end) < todayStart);
  if (upcoming.length > 0) groups.push({ label: 'Próximos', events: upcoming });
  if (past.length > 0) groups.push({ label: 'Pasados', events: past });
  return groups;
}

export default function EventosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { data: events = [], isPending } = useCalendarEventsQuery();
  const deleteMutation = useDeleteCalendarEvent();

  const groups = groupByDate(
    [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  );

  return (
    <div className="space-y-6 h-full overflow-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo evento
        </Button>
      </div>

      {/* Loading — only when no cached data */}
      {isPending && events.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!isPending && events.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
          <div className="rounded-full bg-muted p-6">
            <CalendarDays className={cn('h-10 w-10', NAV_ICON_COLORS.planificacion)} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Sin eventos</p>
            <p className="text-xs mt-1">Creá un evento para reuniones, recordatorios o cualquier contexto de calendario.</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Crear primer evento
          </Button>
        </div>
      )}

      {/* Groups */}
      {groups.map((group) => (
        <section key={group.label} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.events.map((event) => (
              <div
                key={event.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedEvent(event)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedEvent(event);
                  }
                }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 group hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div
                  className="h-10 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: event.color ?? '#3b82f6' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatEventDate(event)}
                  </p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.description}</p>
                  )}
                </div>
                <div
                  className="shrink-0 h-3 w-3 rounded-full"
                  style={{ backgroundColor: event.color ?? '#3b82f6' }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(event.id);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <CreateEventModal open={modalOpen} onOpenChange={setModalOpen} />
      <CalendarEventSheet
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}
      />
    </div>
  );
}
