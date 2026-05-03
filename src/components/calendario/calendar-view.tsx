'use client';

import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventInput } from '@fullcalendar/core';
import type { Task, TaskPriority } from '@/types';

interface CalendarViewProps {
  tasks: Task[];
  onEventDrop?: (taskId: string, newDate: Date) => void;
  onEventClick?: (taskId: string) => void;
}

// Colores de fondo por prioridad (consistentes con el kanban)
const PRIORITY_EVENT_COLORS: Record<
  TaskPriority,
  { backgroundColor: string; textColor: string }
> = {
  urgent: { backgroundColor: '#ef4444', textColor: '#ffffff' }, // red-500
  high: { backgroundColor: '#f97316', textColor: '#ffffff' },   // orange-500
  medium: { backgroundColor: '#3b82f6', textColor: '#ffffff' }, // blue-500
  low: { backgroundColor: '#64748b', textColor: '#ffffff' },    // slate-500
};

export function CalendarView({ tasks, onEventDrop, onEventClick }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Mapeamos las Tareas a Eventos de FullCalendar
  const events: EventInput[] = [];

  tasks.forEach((task) => {
    if (!task.dueDate) return;

    const colors = PRIORITY_EVENT_COLORS[task.priority];
    const startDate = new Date(task.dueDate);
    const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0;

    const baseEvent = {
      title: task.title,
      allDay: isAllDay,
      backgroundColor: colors.backgroundColor,
      textColor: colors.textColor,
      borderColor: colors.backgroundColor,
      extendedProps: {
        status: task.status,
        priority: task.priority,
        priorityColor: colors.backgroundColor,
        isGhost: false,
      },
    };

    // Tarea original activa
    events.push({
      ...baseEvent,
      id: task.id,
      start: task.dueDate,
    });

    // Proyección de tareas fantasmas si hay recurrencia
    if (task.recurrence && task.status !== 'done') {
      let currentDate = new Date(startDate);
      const interval = task.recurrence.interval || 1;

      // Proyectamos 24 repeticiones hacia el futuro
      for (let i = 1; i <= 24; i++) {
        const nextDate = new Date(currentDate);

        switch (task.recurrence.frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + interval);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + (interval * 7));
            if (task.recurrence.dayOfWeek !== undefined) {
              const diff = (task.recurrence.dayOfWeek + 7 - nextDate.getDay()) % 7;
              nextDate.setDate(nextDate.getDate() + diff);
            }
            break;
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + (interval * 14));
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + interval);
            if (task.recurrence.dayOfMonth !== undefined) {
              nextDate.setDate(task.recurrence.dayOfMonth);
            }
            break;
        }

        events.push({
          ...baseEvent,
          id: `${task.id}-recur-${i}`,
          start: nextDate.toISOString(),
          title: `🔁 ${task.title}`,
          classNames: ['opacity-60'],
          editable: false,
          extendedProps: { ...baseEvent.extendedProps, isGhost: true }
        });

        currentDate = nextDate;
      }
    }
  });

  const handleEventDrop = (info: { event: { id: string; start: Date | null; extendedProps: Record<string, unknown> }; revert: () => void }) => {
    if (info.event.extendedProps.isGhost) {
      info.revert();
      return;
    }
    if (onEventDrop && info.event.start) {
      onEventDrop(info.event.id, info.event.start);
    }
  };

  const handleEventClick = (info: { event: { id: string; extendedProps: Record<string, unknown> } }) => {
    if (info.event.extendedProps.isGhost) return;
    if (onEventClick) {
      onEventClick(info.event.id);
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
          border-radius: 4px;
          padding: 2px 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          border: none !important;
          border-left-width: 3px !important;
          border-left-style: solid !important;
        }
        .fc-event:hover {
          filter: brightness(0.88);
          transition: filter 0.15s ease;
        }
        .fc-daygrid-event {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fc-list-event td {
          cursor: pointer;
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
        eventClick={handleEventClick}
        eventDidMount={(info) => {
          const color = info.event.extendedProps.priorityColor;
          if (color) {
            info.el.style.backgroundColor = color;
            info.el.style.borderLeftColor = color;
            info.el.style.color = '#ffffff';
          }
        }}
        height="100%"
        locale="es"
      />
    </div>
  );
}
