'use client';

import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { Task } from '@/types';

interface CalendarViewProps {
  tasks: Task[];
  onEventDrop?: (taskId: string, newDate: Date) => void;
}

export function CalendarView({ tasks, onEventDrop }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Mapeamos las Tareas a Eventos de FullCalendar
  const events = tasks
    .filter((task) => task.dueDate) // Solo mostramos las que tienen fecha
    .map((task) => {
      // Definimos colores según prioridad o estado para mejor UX visual
      let backgroundColor = 'var(--color-primary)';
      if (task.status === 'done') backgroundColor = '#10b981'; // Green
      if (task.status === 'blocked') backgroundColor = '#ef4444'; // Red
      if (task.priority === 'urgent' && task.status !== 'done') backgroundColor = '#f97316'; // Orange

      return {
        id: task.id,
        title: task.title,
        start: task.dueDate!, // Podría ser startDate si quisieramos rangos
        allDay: true,
        backgroundColor,
        borderColor: 'transparent',
        extendedProps: {
          status: task.status,
          priority: task.priority,
        },
      };
    });

  const handleEventDrop = (info: any) => {
    if (onEventDrop) {
      onEventDrop(info.event.id, info.event.start);
    }
  };

  return (
    <div className="h-full w-full rounded-md border bg-card text-card-foreground shadow-sm p-4 fc-theme-standard">
      <style jsx global>{`
        /* Sobreescrituras de diseño para armonizar FullCalendar con Tailwind 4 CSS y tema oscuro */
        .fc {
          --fc-border-color: var(--color-border);
          --fc-button-text-color: var(--color-primary-foreground);
          --fc-button-bg-color: var(--color-primary);
          --fc-button-border-color: var(--color-primary);
          --fc-button-hover-bg-color: var(--color-primary/90);
          --fc-button-hover-border-color: var(--color-primary/90);
          --fc-button-active-bg-color: var(--color-primary/80);
          --fc-button-active-border-color: var(--color-primary/80);
          --fc-event-bg-color: var(--color-primary);
          --fc-event-border-color: var(--color-primary);
          --fc-today-bg-color: rgba(var(--color-primary), 0.05);
          --fc-page-bg-color: transparent;
          font-family: inherit;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
        }
        .fc .fc-button {
          border-radius: var(--radius-md);
          text-transform: capitalize;
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--color-border);
        }
        .fc .fc-cell-shaded, .fc .fc-day-disabled {
          background: var(--color-muted);
        }
        .fc-event {
          border-radius: var(--radius-sm);
          padding: 2px 4px;
          cursor: pointer;
          font-size: 0.75rem;
        }
      `}</style>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek'
        }}
        events={events}
        editable={true}
        droppable={true}
        eventDrop={handleEventDrop}
        height="100%"
        locale="es"
      />
    </div>
  );
}
