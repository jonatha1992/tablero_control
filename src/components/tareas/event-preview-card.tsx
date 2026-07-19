'use client';

import { CalendarDays, Clock3, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ExtractedEvent } from '@/lib/groq/extract-events';

interface NamedItem {
  id: string;
  name: string;
}

interface EventPreviewCardProps {
  event: ExtractedEvent;
  members: NamedItem[];
  onChange: (event: ExtractedEvent) => void;
  onRemove: () => void;
}

const EVENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function EventPreviewCard({
  event,
  members,
  onChange,
  onRemove,
}: EventPreviewCardProps) {
  const eventColor = event.color ?? '#3b82f6';
  const selectedEndDate = event.endDate ?? event.startDate;

  return (
    <div
      className="relative rounded-lg border border-border bg-card p-2.5 text-xs"
      style={{ borderLeftWidth: 4, borderLeftColor: eventColor }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
          {event.order}
        </span>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          Evento
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 pl-7">
        <Input
          value={event.title}
          onChange={(e) => onChange({ ...event, title: e.target.value })}
          className="h-8 bg-background text-xs font-medium"
          placeholder="Event title"
          maxLength={120}
        />

        <textarea
          value={event.description ?? ''}
          onChange={(e) => onChange({ ...event, description: e.target.value || undefined })}
          placeholder="Description (optional)"
          maxLength={500}
          rows={2}
          className="w-full resize-none rounded border border-border bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20"
        />

        <div className="flex flex-wrap gap-1.5">
          <label className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <input
              type="date"
              value={event.startDate}
              onChange={(e) => onChange({ ...event, startDate: e.target.value })}
              className="bg-transparent outline-none"
            />
          </label>

          <label className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
            <input
              type="checkbox"
              checked={event.allDay}
              onChange={(e) =>
                onChange({
                  ...event,
                  allDay: e.target.checked,
                  startTime: e.target.checked ? undefined : event.startTime,
                  endTime: e.target.checked ? undefined : event.endTime,
                })
              }
              className="rounded"
            />
            Todo el dia
          </label>

          {!event.allDay ? (
            <>
              <label className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                <input
                  type="time"
                  value={event.startTime ?? ''}
                  onChange={(e) => onChange({ ...event, startTime: e.target.value || undefined })}
                  className="bg-transparent outline-none"
                />
              </label>
              <label className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
                Fin
                <input
                  type="date"
                  value={selectedEndDate}
                  onChange={(e) => onChange({ ...event, endDate: e.target.value || undefined })}
                  className="bg-transparent outline-none"
                />
                <input
                  type="time"
                  value={event.endTime ?? ''}
                  onChange={(e) => onChange({ ...event, endTime: e.target.value || undefined })}
                  className="bg-transparent outline-none"
                />
              </label>
            </>
          ) : (
            <label className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
              Hasta
              <input
                type="date"
                value={selectedEndDate}
                onChange={(e) => onChange({ ...event, endDate: e.target.value || undefined })}
                className="bg-transparent outline-none"
              />
            </label>
          )}
        </div>

        {members.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              Participantes
            </div>
            <div className="flex flex-wrap gap-1">
              {members.map((member) => {
                const assigned = event.assigneeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...event,
                        assigneeIds: assigned
                          ? event.assigneeIds.filter((id) => id !== member.id)
                          : [...event.assigneeIds, member.id],
                      })
                    }
                    className={cn(
                      'rounded-full border px-1.5 py-0.5 text-[10px] transition-colors',
                      assigned
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary',
                    )}
                  >
                    {member.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Color</span>
          <div className="flex gap-1.5">
            {EVENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Select color ${color}`}
                onClick={() => onChange({ ...event, color })}
                className={cn(
                  'h-5 w-5 rounded-full transition-transform',
                  eventColor === color && 'scale-110 ring-2 ring-ring ring-offset-2',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
