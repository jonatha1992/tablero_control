'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, List, Grid3x3 } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { formatDateTime, TASK_PRIORITY_COLORS } from '@/lib/utils';

// FullCalendar requires dynamic import to avoid SSR issues
const FullCalendarComponent = dynamic(
  () => import('@/components/calendario/full-calendar-wrapper'),
  { ssr: false, loading: () => (
    <div className="flex h-96 items-center justify-center rounded-lg bg-muted/50">
      <p className="text-muted-foreground">Cargando calendario...</p>
    </div>
  )}
);

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-001',
    title: 'Reunión de sprint planning',
    description: 'Planning del sprint 5',
    start: new Date('2026-04-16T09:00:00'),
    end: new Date('2026-04-16T11:00:00'),
    allDay: false,
    assigneeIds: ['member-001', 'member-002'],
    color: '#3b82f6',
    reminders: [{ type: 'notification', minutesBefore: 15 }],
  },
  {
    id: 'evt-002',
    title: 'Review diseño homepage',
    description: 'Revisión de los mockups',
    start: new Date('2026-04-17T14:00:00'),
    end: new Date('2026-04-17T15:30:00'),
    allDay: false,
    taskId: 'task-001',
    assigneeIds: ['member-002'],
    color: '#f59e0b',
    reminders: [],
  },
  {
    id: 'evt-003',
    title: 'Entrega: Fix login Google',
    description: 'Deadline fix de autenticación',
    start: new Date('2026-04-14T00:00:00'),
    end: new Date('2026-04-14T23:59:00'),
    allDay: true,
    taskId: 'task-004',
    assigneeIds: ['member-001'],
    color: '#ef4444',
    reminders: [],
  },
  {
    id: 'evt-004',
    title: 'Deploy producción',
    description: 'Subida a producción v1.2',
    start: new Date('2026-04-22T16:00:00'),
    end: new Date('2026-04-22T17:00:00'),
    allDay: false,
    assigneeIds: ['member-001'],
    color: '#10b981',
    reminders: [{ type: 'notification', minutesBefore: 60 }],
  },
  {
    id: 'evt-005',
    title: 'Daily standup',
    description: 'Reunión diaria del equipo',
    start: new Date('2026-04-16T08:30:00'),
    end: new Date('2026-04-16T08:45:00'),
    allDay: false,
    assigneeIds: [],
    color: '#8b5cf6',
    recurrence: { frequency: 'daily', interval: 1 },
    reminders: [],
  },
  {
    id: 'evt-006',
    title: 'Revisión de código',
    description: 'Code review PR #42',
    start: new Date('2026-04-18T10:00:00'),
    end: new Date('2026-04-18T11:00:00'),
    allDay: false,
    assigneeIds: ['member-001', 'member-002'],
    color: '#06b6d4',
    reminders: [],
  },
  {
    id: 'evt-007',
    title: 'Sprint demo',
    description: 'Demo al cliente del sprint 4',
    start: new Date('2026-04-25T15:00:00'),
    end: new Date('2026-04-25T16:30:00'),
    allDay: false,
    assigneeIds: ['member-001', 'member-002'],
    color: '#3b82f6',
    reminders: [{ type: 'notification', minutesBefore: 30 }],
  },
];

function CreateEventModal({
  open,
  onOpenChange,
  onSave,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (event: CalendarEvent) => void;
  initialDate?: Date;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState(
    initialDate ? initialDate.toISOString().slice(0, 16) : ''
  );
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState('#3b82f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const event: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title,
      description,
      start: new Date(start),
      end: end ? new Date(end) : new Date(new Date(start).getTime() + 3600000),
      allDay,
      assigneeIds: [],
      color,
      reminders: [],
    };
    onSave(event);
    onOpenChange(false);
    setTitle('');
    setDescription('');
    setStart('');
    setEnd('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del evento"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="allday"
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="allday" className="text-sm font-medium">Todo el día</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Inicio *</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Fin</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 rounded border border-input cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!title || !start}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CalendarioPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(SAMPLE_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const upcomingEvents = [...events]
    .filter((e) => e.start >= new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="text-muted-foreground mt-1">Planificación y eventos del equipo</p>
        </div>
        <Button onClick={() => { setSelectedDate(undefined); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo evento
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar - main area */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <FullCalendarComponent
                events={events}
                onEventClick={(event) => {
                  setSelectedEvent(event);
                  setShowDetail(true);
                }}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setShowCreate(true);
                }}
                onEventDrop={(eventId, newStart, newEnd) => {
                  setEvents((prev) =>
                    prev.map((e) =>
                      e.id === eventId ? { ...e, start: newStart, end: newEnd } : e
                    )
                  );
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Próximos eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin eventos próximos</p>
              )}
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => { setSelectedEvent(event); setShowDetail(true); }}
                  className="w-full text-left group"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: event.color ?? '#3b82f6' }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.allDay
                          ? event.start.toLocaleDateString('es', { day: '2-digit', month: 'short' })
                          : formatDateTime(event.start)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Este mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {[
                { label: 'Total eventos', value: events.length },
                { label: 'Todo el día', value: events.filter(e => e.allDay).length },
                { label: 'Con tarea', value: events.filter(e => e.taskId).length },
                { label: 'Con recurrencia', value: events.filter(e => e.recurrence).length },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: selectedEvent?.color ?? '#3b82f6' }}
              />
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
            </div>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              {selectedEvent.description && (
                <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Inicio</p>
                  <p>{selectedEvent.allDay
                    ? selectedEvent.start.toLocaleDateString('es')
                    : formatDateTime(selectedEvent.start)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Fin</p>
                  <p>{selectedEvent.allDay
                    ? selectedEvent.end.toLocaleDateString('es')
                    : formatDateTime(selectedEvent.end)}</p>
                </div>
              </div>
              {selectedEvent.allDay && (
                <Badge variant="secondary">Todo el día</Badge>
              )}
              {selectedEvent.taskId && (
                <Badge variant="outline">Vinculado a tarea</Badge>
              )}
              {selectedEvent.recurrence && (
                <Badge variant="secondary">
                  Recurrente: {selectedEvent.recurrence.frequency}
                </Badge>
              )}
              {selectedEvent.reminders.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Recordatorios</p>
                  {selectedEvent.reminders.map((r, i) => (
                    <p key={i}>{r.minutesBefore} min antes · {r.type === 'notification' ? 'Notificación' : 'Email'}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (selectedEvent) {
                  setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
                }
                setShowDetail(false);
              }}
            >
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => setShowDetail(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Event Modal */}
      <CreateEventModal
        open={showCreate}
        onOpenChange={setShowCreate}
        initialDate={selectedDate}
        onSave={(event) => setEvents(prev => [...prev, event])}
      />
    </div>
  );
}
