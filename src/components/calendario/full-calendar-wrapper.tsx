'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { CalendarEvent } from '@/types';

interface FullCalendarWrapperProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
  onEventDrop: (eventId: string, newStart: Date, newEnd: Date) => void;
}

export default function FullCalendarWrapper({
  events,
  onEventClick,
  onDateSelect,
  onEventDrop,
}: FullCalendarWrapperProps) {
  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: e.color ?? '#3b82f6',
    borderColor: e.color ?? '#3b82f6',
    extendedProps: { original: e },
  }));

  return (
    <div className="fc-wrapper">
      <style>{`
        .fc-wrapper .fc {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--primary) / 0.08);
          --fc-event-bg-color: hsl(var(--primary));
          --fc-event-border-color: hsl(var(--primary));
          --fc-page-bg-color: transparent;
          font-size: 0.875rem;
        }
        .fc-wrapper .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: 600;
        }
        .fc-wrapper .fc-button {
          font-size: 0.8rem;
          padding: 0.3em 0.7em;
          border-radius: 0.375rem;
          text-transform: none;
          font-weight: 500;
        }
        .fc-wrapper .fc-event {
          cursor: pointer;
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }
        .fc-wrapper .fc-daygrid-event {
          padding: 1px 4px;
        }
        .fc-wrapper .fc-col-header-cell {
          font-weight: 500;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .fc-wrapper .fc-list-event:hover td {
          background-color: hsl(var(--accent));
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        locale="es"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          list: 'Lista',
        }}
        events={fcEvents}
        editable
        selectable
        selectMirror
        dayMaxEvents
        weekends
        nowIndicator
        height="auto"
        aspectRatio={1.8}
        eventClick={(info) => {
          const original = info.event.extendedProps.original as CalendarEvent;
          onEventClick(original);
        }}
        select={(info) => {
          onDateSelect(info.start);
        }}
        eventDrop={(info) => {
          onEventDrop(
            info.event.id,
            info.event.start ?? new Date(),
            info.event.end ?? new Date()
          );
        }}
        eventResize={(info) => {
          onEventDrop(
            info.event.id,
            info.event.start ?? new Date(),
            info.event.end ?? new Date()
          );
        }}
      />
    </div>
  );
}
