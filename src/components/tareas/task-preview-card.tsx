'use client';

import { MapPin, X, Repeat, FolderKanban, Timer, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { TaskPriority, TaskStatus, TaskType } from '@/types/domain/task';
import { useSpaceLabels } from '@/hooks/use-space-labels';

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Por hacer',
  in_progress: 'En progreso',
  in_review: 'En revisión',
  done: 'Finalizado',
  blocked: 'Bloqueada',
  archived: 'Archivada',
};

export const TYPE_LABELS: Record<TaskType, string> = {
  task: 'Tarea',
  feature: 'Feature',
  bug: 'Bug',
  improvement: 'Mejora',
  documentation: 'Docs',
};

export const PRIORITY_BORDER: Record<TaskPriority, string> = {
  low: 'border-l-slate-300',
  medium: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-500',
};

interface NamedItem {
  id: string;
  name: string;
}

export interface TaskPreviewCardProps {
  task: ExtractedTask;
  members: NamedItem[];
  locations: NamedItem[];
  projects?: NamedItem[];
  cycles?: NamedItem[];
  objectives?: NamedItem[];
  onChange: (t: ExtractedTask) => void;
  onRemove: () => void;
  onOpenInForm?: () => void;
}

export function TaskPreviewCard({
  task,
  members,
  locations,
  projects = [],
  cycles = [],
  objectives = [],
  onChange,
  onRemove,
}: TaskPreviewCardProps) {
  const labels = useSpaceLabels();

  const recurrenceLabel = task.recurrence
    ? ({
        daily: 'Diario',
        weekly: 'Semanal',
        biweekly: 'Quincenal',
        monthly: 'Mensual',
      }[task.recurrence.frequency] ?? task.recurrence.frequency)
    : null;

  return (
    <div
      className={cn(
        'relative rounded-lg border border-border bg-card p-2.5 border-l-4 text-xs',
        PRIORITY_BORDER[task.priority],
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
          {task.order}
        </span>
        <Input
          value={task.title}
          onChange={(e) => onChange({ ...task, title: e.target.value })}
          className="h-8 text-xs font-medium bg-background border-border flex-1"
          placeholder="Título de la tarea"
          maxLength={200}
        />
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="pl-7 mt-1.5 space-y-2">
        <textarea
          value={task.description ?? ''}
          onChange={(e) => onChange({ ...task, description: e.target.value || undefined })}
          placeholder="Descripción (opcional)"
          maxLength={500}
          rows={2}
          className="w-full rounded border border-border bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
        />

        <div className="flex flex-wrap gap-1.5">
          <select
            value={task.priority}
            onChange={(e) => onChange({ ...task, priority: e.target.value as TaskPriority })}
            className="rounded border border-border bg-background text-foreground px-1 py-0.5 text-[10px]"
          >
            {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          <select
            value={task.status}
            onChange={(e) => onChange({ ...task, status: e.target.value as TaskStatus })}
            className="rounded border border-border bg-background text-foreground px-1 py-0.5 text-[10px]"
          >
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={task.type}
            onChange={(e) => onChange({ ...task, type: e.target.value as TaskType })}
            className="rounded border border-border bg-background text-foreground px-1 py-0.5 text-[10px]"
          >
            {(Object.keys(TYPE_LABELS) as TaskType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>

          {projects.length > 0 && (
            <div className="flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
              <FolderKanban className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <select
                value={task.projectId ?? ''}
                onChange={(e) => onChange({ ...task, projectId: e.target.value || undefined })}
                className="bg-background text-foreground outline-none max-w-[100px]"
              >
                <option value="">Tablero</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {cycles.length > 0 && (
            <div className="flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
              <Timer className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <select
                value={task.cycleId ?? ''}
                onChange={(e) => onChange({ ...task, cycleId: e.target.value || undefined })}
                className="bg-background text-foreground outline-none max-w-[100px]"
              >
                <option value="">Sin sprint</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {objectives.length > 0 && (
            <div className="flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
              <Target className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <select
                value={task.objectiveId ?? ''}
                onChange={(e) => onChange({ ...task, objectiveId: e.target.value || undefined })}
                className="bg-background text-foreground outline-none max-w-[100px]"
              >
                <option value="">Sin objetivo</option>
                {objectives.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}

          {locations.length > 0 && (
            <div className="flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
              <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <select
                value={task.locationId ?? ''}
                onChange={(e) => onChange({ ...task, locationId: e.target.value || undefined })}
                className="bg-background text-foreground outline-none max-w-[90px]"
              >
                <option value="">Sin {labels.site.toLowerCase()}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          )}

          <input
            type="date"
            value={task.dueDate ?? ''}
            onChange={(e) => onChange({ ...task, dueDate: e.target.value || undefined })}
            className="rounded border border-border bg-background px-1 py-0.5 text-[10px]"
          />
          <input
            type="time"
            value={task.dueTime ?? ''}
            onChange={(e) => onChange({ ...task, dueTime: e.target.value || undefined })}
            className="rounded border border-border bg-background px-1 py-0.5 text-[10px]"
          />
          <label className="flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
            ⏱
            <input
              type="number"
              min={0}
              max={99}
              step={0.25}
              value={task.estimatedHours ?? ''}
              onChange={(e) =>
                onChange({
                  ...task,
                  estimatedHours: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="h"
              className="w-12 bg-transparent outline-none"
            />
            h
          </label>

          {recurrenceLabel && (
            <span className="flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1 py-0.5 text-[10px] text-primary font-medium">
              <Repeat className="h-2.5 w-2.5" />
              {recurrenceLabel}
            </span>
          )}
        </div>

        <Input
          value={task.tags?.join(', ') ?? ''}
          onChange={(e) =>
            onChange({
              ...task,
              tags: e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          placeholder="Tags (separados por coma)"
          className="h-7 text-[10px]"
        />

        {members.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {members.map((m) => {
              const assigned = task.assigneeIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...task,
                      assigneeIds: assigned
                        ? task.assigneeIds.filter((id) => id !== m.id)
                        : [...task.assigneeIds, m.id],
                    })
                  }
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] border transition-colors',
                    assigned
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary',
                  )}
                >
                  {m.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        )}

        {task.checklist && task.checklist.length > 0 && (
          <ul className="space-y-0.5 text-[10px] text-muted-foreground">
            {task.checklist.map((item, i) => (
              <li key={item.id} className="flex items-center gap-1">
                <span>☐</span>
                <input
                  value={item.text}
                  onChange={(e) => {
                    const checklist = [...(task.checklist ?? [])];
                    checklist[i] = { ...item, text: e.target.value };
                    onChange({ ...task, checklist });
                  }}
                  className="flex-1 bg-transparent border-b border-border/50 outline-none"
                />
              </li>
            ))}
          </ul>
        )}

        {task.subtasks && task.subtasks.length > 0 && (
          <ul className="space-y-0.5 text-[10px]">
            {task.subtasks.map((st, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="text-muted-foreground">↳</span>
                <input
                  value={st}
                  onChange={(e) => {
                    const subtasks = [...(task.subtasks ?? [])];
                    subtasks[i] = e.target.value;
                    onChange({ ...task, subtasks });
                  }}
                  className="flex-1 bg-transparent border-b border-border/50 outline-none"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
