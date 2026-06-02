'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateCalendarEvent } from '@/hooks/mutations/use-create-calendar-event';
import { useMembersQuery } from '@/hooks/queries/use-members-query';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toLocalDateTimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateEventModal({ open, onOpenChange }: CreateEventModalProps) {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState(toLocalDateTimeValue(now));
  const [end, setEnd] = useState(toLocalDateTimeValue(oneHourLater));
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const { data: members = [] } = useMembersQuery();
  const createMutation = useCreateCalendarEvent();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDate = allDay
      ? new Date(start.split('T')[0] + 'T00:00:00')
      : new Date(start);
    const endDate = allDay
      ? new Date(start.split('T')[0] + 'T23:59:59')
      : new Date(end);

    createMutation.mutate(
      { title: title.trim(), description: description.trim() || undefined, start: startDate, end: endDate, allDay, color, assigneeIds: selectedAssignees.length ? selectedAssignees : undefined },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setStart(toLocalDateTimeValue(new Date()));
          setEnd(toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)));
          setAllDay(false);
          setSelectedAssignees([]);
          onOpenChange(false);
        },
      },
    );
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <DialogTitle>Nuevo evento</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder="Título del evento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />

          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded"
            />
            Todo el día
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Inicio
                </span>
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Fin
                </span>
                <input
                  type="datetime-local"
                  value={end}
                  min={start}
                  onChange={(e) => setEnd(e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}

          {allDay && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Fecha</span>
              <input
                type="date"
                value={start.split('T')[0]}
                onChange={(e) => setStart(e.target.value + 'T00:00')}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* #11: Participantes */}
          {members.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Participantes
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {members.map((m) => {
                  const selected = selectedAssignees.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setSelectedAssignees((prev) =>
                          selected ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                        )
                      }
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
                      )}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Color</span>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-6 w-6 rounded-full transition-transform',
                    color === c && 'ring-2 ring-offset-2 ring-ring scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!title.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Creando…' : 'Crear evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
