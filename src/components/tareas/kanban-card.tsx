'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  MessageSquare,
  Paperclip,
  Clock,
  MoreVertical,
  AlertTriangle,
  ChevronUp,
  Check,
  MapPin,
  Trash2,
  ListTree,
  ChevronDown,
  Archive,
  ListChecks,
} from 'lucide-react';
import { cn, TASK_PRIORITY_LABELS } from '@/lib/utils';
import { formatMonthDay, formatTimeHHMM } from '@/lib/utils/date';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSubtasksQuery, subtaskKeys } from '@/hooks/queries/use-subtasks-query';
import { useMoveTask } from '@/hooks/mutations/use-move-task';
import { useQueryClient } from '@tanstack/react-query';
import { TaskDetailModal } from './task-detail-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { color: string; bg: string; icon: typeof AlertTriangle; order: number; border: string }
> = {
  urgent: {
    color: 'text-red-800 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800/50',
    icon: AlertTriangle,
    order: 0,
    border: 'border-l-red-500',
  },
  high: {
    color: 'text-orange-800 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-800/50',
    icon: ChevronUp,
    order: 1,
    border: 'border-l-orange-500',
  },
  medium: {
    color: 'text-blue-800 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800/50',
    icon: ChevronUp,
    order: 2,
    border: 'border-l-blue-400',
  },
  low: {
    color: 'text-slate-800 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700',
    icon: ChevronUp,
    order: 3,
    border: 'border-l-slate-300',
  },
};

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

interface KanbanCardProps {
  task: Task;
  column: TaskStatus;
  onMove: (taskId: string, from: TaskStatus, to: TaskStatus) => void;
  onPriorityChange: (taskId: string, newPriority: TaskPriority) => void;
  onLocationChange?: (taskId: string, locationId: string | null) => void;
  onDelete?: (taskId: string) => void;
  onToggleSelect?: (taskId: string) => void;
  onClick: (task: Task) => void;
  isSelected: boolean;
  isSelectMode: boolean;
  isOverlay?: boolean;
  locationName?: string;
  locations?: { id: string; name: string }[];
}

export function KanbanCard({ task, column, onMove, onPriorityChange, onLocationChange, onDelete, onToggleSelect, onClick, isSelected, isSelectMode, isOverlay, locationName, locations }: KanbanCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priorityConfig.icon;
  const shortId = task.id.slice(0, 6).toUpperCase();
  const [subtasksExpanded, setSubtasksExpanded] = useState(false);
  const hasSubtasks = (task.subtaskIds?.length ?? 0) > 0;
  const checklistTotal = task.checklist?.length ?? 0;
  const checklistDone = task.checklist?.filter((i) => i.done).length ?? 0;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task, from: column },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative rounded-lg border border-l-4 bg-card p-2.5 shadow-sm transition-shadow duration-500 hover:shadow-md cursor-grab active:cursor-grabbing select-none',
        priorityConfig.border,
        isSelected
          ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
          : 'border-border',
        isDragging && !isOverlay && 'opacity-30 border-dashed scale-95 z-50',
        task.priority === 'urgent' && 'animate-pulse-slow'
      )}
      onClick={() => {
        if (transform) return;
        if (isSelectMode) onClick(task);
      }}
      onDoubleClick={() => {
        if (transform) return;
        if (!isSelectMode) onClick(task);
      }}
    >
      {/* Urgent indicator */}
      {task.priority === 'urgent' && (
        <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm z-10">
          <AlertTriangle className="h-3 w-3" />
        </div>
      )}

      {/* Header: checkbox + title + avatars + menú */}
      <div className="flex items-start gap-1.5 mb-1.5">
        {onToggleSelect && (
          <button
            className={cn(
              'shrink-0 mt-0.5 transition-opacity',
              isSelected || isSelectMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
            title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
          >
            <div className={cn(
              'h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-primary/60'
            )}>
              {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </div>
          </button>
        )}
        <h4 className="text-xs font-semibold leading-tight line-clamp-2 flex-1">{task.title}</h4>

        {/* Avatares de asignados — junto al título */}
        {(() => {
          if (!task.assigneeIds || task.assigneeIds.length === 0) return null;
          const valid = task.assigneeIds
            .map((id) => task.assignees?.find((x) => x.id === id))
            .filter((a): a is NonNullable<typeof a> => !!a);
          if (valid.length === 0) return null;
          const shown = valid.slice(0, 2);
          const rest = valid.length - shown.length;
          return (
            <div className="flex items-center -space-x-1 shrink-0 mt-0.5">
              {shown.map((a) => {
                const initials = a.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <Avatar key={a.id} className="h-4 w-4 border border-background" title={a.name}>
                    {a.avatar && <AvatarImage src={a.avatar} alt={a.name} />}
                    <AvatarFallback className="text-[7px] bg-primary/15">{initials}</AvatarFallback>
                  </Avatar>
                );
              })}
              {rest > 0 && (
                <span className="text-[9px] text-muted-foreground pl-1.5">+{rest}</span>
              )}
            </div>
          );
        })()}

        {onDelete && !isSelectMode && (
          <button
            className="opacity-70 hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive mt-0.5 text-muted-foreground"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            title="Eliminar tarea"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-70 hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-muted mt-0.5 text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
              title="Opciones de tarea"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onClick(task);
              }}
            >
              Ver / Editar
            </DropdownMenuItem>
            {locations && onLocationChange && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                  Mover a...
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocationChange(task.id, null);
                      }}
                      className={cn(task.locationId === null && 'bg-muted')}
                    >
                      Ninguno
                    </DropdownMenuItem>
                    {locations.map((loc) => (
                      <DropdownMenuItem
                        key={loc.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocationChange(task.id, loc.id);
                        }}
                        className={cn(task.locationId === loc.id && 'bg-muted')}
                      >
                        {loc.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}
            {task.status === 'done' && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(task.id, column, 'archived');
                }}
              >
                <Archive className="h-3.5 w-3.5 mr-2" />
                Archivar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Location — debajo del título si existe */}
      {locationName && (
        <div className="flex items-center gap-1 mb-1.5">
          <MapPin className="h-2.5 w-2.5 text-muted-foreground/60 shrink-0" />
          <span className="text-[9px] text-muted-foreground/80 truncate">{locationName}</span>
        </div>
      )}

      {/* Sección expandible al hacer hover */}
      <div className="overflow-hidden max-h-0 group-hover:max-h-40 transition-[max-height] duration-500 ease-in-out delay-75">
        {task.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-3 mb-1.5">{task.description}</p>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{task.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer: prioridad + meta — siempre visible */}
      <div className="flex items-center justify-between mt-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:opacity-80',
                priorityConfig.bg,
                priorityConfig.color
              )}
              title={`Prioridad: ${TASK_PRIORITY_LABELS[task.priority]} — clic para cambiar`}
            >
              <PriorityIcon className="h-3 w-3" />
              {TASK_PRIORITY_LABELS[task.priority]}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="z-[200] min-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Cambiar prioridad
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRIORITIES.map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const Icon = cfg.icon;
              const isActive = p === task.priority;
              return (
                <DropdownMenuItem
                  key={p}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPriorityChange(task.id, p);
                  }}
                  className={cn('flex items-center gap-2 text-xs cursor-pointer', isActive && 'bg-muted')}
                >
                  <Icon className={cn('h-3 w-3', cfg.color)} />
                  <span className={cfg.color}>{TASK_PRIORITY_LABELS[p]}</span>
                  {isActive && <Check className="ml-auto h-3 w-3 text-muted-foreground" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Meta: id, comentarios, adjuntos, checklist, subtareas, fecha */}
        <div className="flex items-center gap-2 text-muted-foreground flex-wrap justify-end">
          <span className="font-mono text-[10px] text-muted-foreground/40">#{shortId}</span>
          {task.commentCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{task.commentCount}</span>
            </div>
          )}
          {task.attachmentUrls && task.attachmentUrls.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{task.attachmentUrls.length}</span>
            </div>
          )}
          {checklistTotal > 0 && (
            <div
              className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
              title="Checklist"
            >
              <ListChecks className="h-3.5 w-3.5" />
              <span className="tabular-nums">{checklistDone}/{checklistTotal}</span>
            </div>
          )}
          {hasSubtasks && (
            <button
              onClick={(e) => { e.stopPropagation(); setSubtasksExpanded((v) => !v); }}
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors',
                subtasksExpanded
                  ? 'bg-primary/15 text-primary'
                  : 'hover:bg-muted hover:text-foreground'
              )}
              title="Ver subtareas"
            >
              <ListTree className="h-3.5 w-3.5" />
              <span>{task.subtasksCompleted}/{task.subtaskIds!.length}</span>
              <ChevronDown className={cn('h-3 w-3 transition-transform', subtasksExpanded && 'rotate-180')} />
            </button>
          )}
          {task.dueDate && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                new Date(task.dueDate) < new Date() && task.status !== 'done'
                  ? 'text-red-500 font-semibold'
                  : ''
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>
                {formatMonthDay(task.dueDate, 'es')}
                {(() => {
                  const d = new Date(task.dueDate);
                  return (d.getHours() !== 0 || d.getMinutes() !== 0)
                    ? ` ${formatTimeHHMM(d)}`
                    : null;
                })()}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Subtareas inline expandibles */}
      {hasSubtasks && subtasksExpanded && (
        <SubtaskInlineList taskId={task.id} />
      )}
    </div>
  );
}

function SubtaskInlineList({ taskId }: { taskId: string }) {
  const { data: subtasks = [], isLoading } = useSubtasksQuery(taskId);
  const moveTask = useMoveTask();
  const queryClient = useQueryClient();
  const [openSubtask, setOpenSubtask] = useState<Task | null>(null);

  if (isLoading) return <p className="text-[10px] text-muted-foreground mt-2 px-0.5">Cargando...</p>;
  if (!subtasks.length) return null;

  return (
    <>
      <div className="mt-2 space-y-1 border-t pt-2">
        {subtasks.map((sub) => (
          <div key={sub.id} className="group/isub flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveTask.mutate(
                  { taskId: sub.id, newStatus: sub.status === 'done' ? 'todo' : 'done' },
                  { onSettled: () => queryClient.invalidateQueries({ queryKey: subtaskKeys.byTask(taskId) }) }
                );
              }}
              className={cn(
                'h-3.5 w-3.5 shrink-0 rounded border border-muted-foreground/40 flex items-center justify-center transition-colors hover:border-primary',
                sub.status === 'done' && 'bg-primary border-primary'
              )}
              title={sub.status === 'done' ? 'Marcar pendiente' : 'Marcar completada'}
            >
              {sub.status === 'done' && <Check className="h-2 w-2 text-primary-foreground" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpenSubtask(sub); }}
              className={cn(
                'text-[10px] flex-1 text-left leading-tight hover:text-primary transition-colors',
                sub.status === 'done' && 'line-through text-muted-foreground'
              )}
            >
              {sub.title}
            </button>
          </div>
        ))}
      </div>

      <TaskDetailModal
        task={openSubtask}
        open={!!openSubtask}
        onOpenChange={(o) => { if (!o) setOpenSubtask(null); }}
      />
    </>
  );
}
