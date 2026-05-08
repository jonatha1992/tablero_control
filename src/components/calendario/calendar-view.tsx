'use client';

import { useRef, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventInput } from '@fullcalendar/core';
import type { Task, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  tasks: Task[];
  onEventDrop?: (taskId: string, newDate: Date) => void;
  onEventClick?: (taskId: string) => void;
  onDateClick?: (date: Date) => void;
}

const PRIORITY_EVENT_COLORS: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  urgent: { bg: '#ef4444', text: '#ffffff', label: 'Urgente' },
  high:   { bg: '#f97316', text: '#ffffff', label: 'Alta' },
  medium: { bg: '#3b82f6', text: '#ffffff', label: 'Media' },
  low:    { bg: '#64748b', text: '#ffffff', label: 'Baja' },
};

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog', todo: 'Por hacer', in_progress: 'En progreso',
  in_review: 'En revisión', done: 'Hecho', blocked: 'Bloqueado',
};

interface TooltipState {
  task: Task;
  x: number;
  y: number;
}

export function CalendarView({ tasks, onEventDrop, onEventClick, onDateClick }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const events: EventInput[] = [];

  tasks.forEach((task) => {
    if (!task.dueDate) return;
    const colors = PRIORITY_EVENT_COLORS[task.priority];
    const startDate = new Date(task.dueDate);
    const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0;

    const baseEvent = {
      title: task.title,
      allDay: isAllDay,
      backgroundColor: colors.bg,
      textColor: colors.text,
      borderColor: colors.bg,
      extendedProps: { taskId: task.id, status: task.status, priority: task.priority, isGhost: false },
    };

    events.push({ ...baseEvent, id: task.id, start: task.dueDate });

    if (task.recurrence && task.status !== 'done') {
      let currentDate = new Date(startDate);
      const interval = task.recurrence.interval || 1;
      for (let i = 1; i <= 24; i++) {
        const nextDate = new Date(currentDate);
        switch (task.recurrence.frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + interval);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + interval * 7);
            if (task.recurrence.dayOfWeek !== undefined) {
              const diff = (task.recurrence.dayOfWeek + 7 - nextDate.getDay()) % 7;
              nextDate.setDate(nextDate.getDate() + diff);
            }
            break;
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + interval * 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + interval);
            if (task.recurrence.dayOfMonth !== undefined) nextDate.setDate(task.recurrence.dayOfMonth);
            break;
        }
        events.push({
          ...baseEvent,
          id: `${task.id}-recur-${i}`,
          start: nextDate.toISOString(),
          title: `🔁 ${task.title}`,
          classNames: ['fc-event-ghost'],
          editable: false,
          extendedProps: { ...baseEvent.extendedProps, isGhost: true },
        });
        currentDate = nextDate;
      }
    }
  });

  const showTooltip = useCallback((taskId: string, x: number, y: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltip({ task, x, y });
  }, [tasks]);

  const hideTooltip = useCallback(() => {
    tooltipTimeout.current = setTimeout(() => setTooltip(null), 120);
  }, []);

  const handleEventClick = (info: { event: { id: string; extendedProps: Record<string, unknown> } }) => {
    if (info.event.extendedProps.isGhost) return;
    if (onEventClick) {
      onEventClick(info.event.id);
    }
  };

  const handleDateClick = (info: { date: Date }) => {
    if (onDateClick) {
      onDateClick(info.date);
    }
  });

  const showTooltip = useCallback((taskId: string, x: number, y: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltip({ task, x, y });
  }, [tasks]);

  const hideTooltip = useCallback(() => {
    tooltipTimeout.current = setTimeout(() => setTooltip(null), 120);
  }, []);

  return (
    <div className="relative h-full w-full rounded-md border bg-card text-card-foreground shadow-sm p-4">
      <style jsx global>{`
        /* ── FullCalendar dark-mode override ── */
        .fc {
          --fc-border-color: hsl(var(--border));
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: hsl(var(--muted));
          --fc-list-event-hover-bg-color: hsl(var(--muted));
          --fc-today-bg-color: color-mix(in srgb, hsl(var(--primary)) 8%, transparent);
          --fc-highlight-color: color-mix(in srgb, hsl(var(--primary)) 12%, transparent);
          font-family: inherit;
          font-size: 0.875rem;
        }

        /* Toolbar */
        .fc .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .fc .fc-button {
          background: hsl(var(--secondary));
          color: hsl(var(--secondary-foreground));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          padding: 0.25rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          text-transform: capitalize;
          box-shadow: none;
        }
        .fc .fc-button:hover {
          background: hsl(var(--muted));
          border-color: hsl(var(--border));
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }

        /* Grid */
        .fc-theme-standard td,
        .fc-theme-standard th,
        .fc-theme-standard .fc-scrollgrid {
          border-color: hsl(var(--foreground) / 0.1) !important;
        }
        .fc .fc-daygrid-day {
          background: hsl(var(--card));
        }
        .fc .fc-daygrid-day:hover {
          background: hsl(var(--muted) / 0.5);
        }
        .fc .fc-day-today {
          background: color-mix(in srgb, hsl(var(--primary)) 8%, hsl(var(--card))) !important;
        }
        .fc .fc-day-other .fc-daygrid-day-number {
          opacity: 0.35;
        }
        .fc .fc-col-header-cell {
          background: hsl(var(--muted) / 0.4);
          padding: 0.375rem 0;
        }
        .fc .fc-col-header-cell-cushion {
          color: hsl(var(--muted-foreground));
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .fc .fc-daygrid-day-number {
          color: hsl(var(--muted-foreground));
          font-size: 0.8rem;
          padding: 4px 6px;
        }
        .fc .fc-day-today .fc-daygrid-day-number {
          color: hsl(var(--primary));
          font-weight: 700;
        }

        /* Events */
        .fc-event {
          border-radius: 4px !important;
          padding: 1px 5px !important;
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 500;
          border: none !important;
          border-left: 3px solid transparent !important;
          transition: filter 0.1s, transform 0.1s;
        }
        .fc-event:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
          z-index: 10;
        }
        .fc-event-ghost {
          opacity: 0.45 !important;
        }
        .fc-event-ghost:hover {
          cursor: default;
          filter: none;
          transform: none;
        }
        .fc-daygrid-event {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* List view */
        .fc-list-event td { cursor: pointer; }
        .fc-list-event:hover td { background: hsl(var(--muted) / 0.5) !important; }
        .fc-list-day-cushion { background: hsl(var(--muted) / 0.4) !important; }
        .fc-list-empty { color: hsl(var(--muted-foreground)); padding: 2rem; text-align: center; }
      `}</style>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek',
        }}
        buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', list: 'Lista' }}
        events={events}
        editable={true}
        droppable={true}
        eventDrop={(info) => {
          if (info.event.extendedProps.isGhost) { info.revert(); return; }
          if (onEventDrop && info.event.start) onEventDrop(info.event.id, info.event.start);
        }}
        eventClick={(info) => {
          if (info.event.extendedProps.isGhost) return;
          if (onEventClick) onEventClick(info.event.id);
        }}
        dateClick={(info) => { if (onDateClick) onDateClick(info.date); }}
        eventDidMount={(info) => {
          const { bg } = PRIORITY_EVENT_COLORS[info.event.extendedProps.priority as TaskPriority] ?? {};
          if (bg) {
            info.el.style.backgroundColor = bg;
            info.el.style.borderLeftColor = bg;
            info.el.style.color = '#ffffff';
          }
        }}
        eventMouseEnter={(info) => {
          if (info.event.extendedProps.isGhost) return;
          const rect = info.el.getBoundingClientRect();
          showTooltip(info.event.extendedProps.taskId as string, rect.left, rect.bottom + 6);
        }}
        eventMouseLeave={() => hideTooltip()}
        height="auto"
        locale="es"
        dayMaxEvents={3}
      />

      {/* Hover tooltip */}
      {tooltip && (
        <TaskTooltip
          task={tooltip.task}
          x={tooltip.x}
          y={tooltip.y}
          onMouseEnter={() => { if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current); }}
          onMouseLeave={hideTooltip}
        />
      )}
    </div>
  );
}

function TaskTooltip({
  task,
  x,
  y,
  onMouseEnter,
  onMouseLeave,
}: {
  task: Task;
  x: number;
  y: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const colors = PRIORITY_EVENT_COLORS[task.priority];
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';

  return (
    <div
      className="fixed z-50 w-64 rounded-lg border border-border bg-popover p-3 shadow-xl text-sm"
      style={{ left: Math.min(x, window.innerWidth - 272), top: y }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Priority stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: colors.bg }}
      />
      <div className="pl-2">
        <p className="font-semibold leading-snug text-foreground line-clamp-2">{task.title}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: colors.bg }}
          >
            {colors.label}
          </span>
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
            task.status === 'done' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
            task.status === 'in_progress' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
            task.status === 'blocked' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
            'border-border text-muted-foreground bg-muted/30'
          )}>
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
        </div>

        {dueDate && (
          <p className={cn('mt-2 text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
            {isOverdue ? '⚠ Vencida: ' : '📅 '}
            {dueDate.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
            {dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0
              ? ` ${dueDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </p>
        )}

        {task.description && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
      </div>
    </div>
  );
}
