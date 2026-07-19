'use client';

import { MapPin, X, Repeat, Timer, Target, ChevronDown, Check } from 'lucide-react';
import { ProjectMultiPicker } from '@/components/tareas/project-multi-picker';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  type SelectOption,
} from '@/lib/constants/task-colors';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { TaskPriority, TaskStatus, TaskType } from '@/types/domain/task';
import { useSpaceLabels } from '@/hooks/use-space-labels';
import type { LucideIcon } from 'lucide-react';

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

function PreviewColoredSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
}) {
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded border border-border bg-background px-1 py-0.5 text-[10px] text-foreground hover:bg-accent transition-colors"
        >
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', selected.dot)} />
          <span className="max-w-[72px] truncate">{selected.label}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[400] min-w-[8.5rem]">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="gap-2 text-xs"
          >
            <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dot)} />
            {opt.label}
            {opt.value === value && <Check className="ml-auto h-3 w-3 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PreviewIconSelect({
  icon: Icon,
  value,
  placeholder,
  options,
  onChange,
}: {
  icon: LucideIcon;
  value: string;
  placeholder: string;
  options: NamedItem[];
  onChange: (id: string | undefined) => void;
}) {
  const selected = options.find((o) => o.id === value);
  const label = selected?.name ?? placeholder;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px] text-foreground hover:bg-accent transition-colors max-w-[130px]"
        >
          <Icon className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[400] max-h-56 overflow-y-auto min-w-[8.5rem]">
        <DropdownMenuItem
          onClick={() => onChange(undefined)}
          className="gap-2 text-xs text-muted-foreground"
        >
          <Icon className="h-3 w-3 shrink-0 opacity-60" />
          {placeholder}
          {!value && <Check className="ml-auto h-3 w-3 text-primary" />}
        </DropdownMenuItem>
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="gap-2 text-xs"
          >
            <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{opt.name}</span>
            {opt.id === value && <Check className="ml-auto h-3 w-3 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NamedItem {
  id: string;
  name: string;
  status?: string;
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
          <PreviewColoredSelect
            value={task.priority}
            options={PRIORITY_OPTIONS}
            onChange={(priority) => onChange({ ...task, priority })}
          />
          <PreviewColoredSelect
            value={task.status}
            options={STATUS_OPTIONS.filter((o) => o.value !== 'archived')}
            onChange={(status) => onChange({ ...task, status })}
          />
          <PreviewColoredSelect
            value={task.type}
            options={TYPE_OPTIONS}
            onChange={(type) => onChange({ ...task, type })}
          />

          {projects.length > 0 && (
            <ProjectMultiPicker
              projects={projects}
              value={
                task.projectIds?.length
                  ? task.projectIds
                  : task.projectId
                    ? [task.projectId]
                    : []
              }
              onChange={(ids) =>
                onChange({
                  ...task,
                  projectIds: ids.length ? ids : undefined,
                  projectId: ids.length === 1 ? ids[0] : undefined,
                })
              }
              size="sm"
            />
          )}

          {cycles.length > 0 && (
            <PreviewIconSelect
              icon={Timer}
              value={task.cycleId ?? ''}
              placeholder="Sin sprint"
              options={cycles}
              onChange={(cycleId) => onChange({ ...task, cycleId })}
            />
          )}

          {objectives.length > 0 && (
            <PreviewIconSelect
              icon={Target}
              value={task.objectiveId ?? ''}
              placeholder="Sin objetivo"
              options={objectives}
              onChange={(objectiveId) => onChange({ ...task, objectiveId })}
            />
          )}

          {locations.length > 0 && (
            <PreviewIconSelect
              icon={MapPin}
              value={task.locationId ?? ''}
              placeholder={`Sin ${labels.site.toLowerCase()}`}
              options={locations}
              onChange={(locationId) => onChange({ ...task, locationId })}
            />
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

      </div>
    </div>
  );
}
