'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  MessageSquare,
  Paperclip,
  Clock,
  MoreVertical,
  CheckSquare,
  AlertTriangle,
  ChevronUp,
  Check,
} from 'lucide-react';
import { cn, TASK_PRIORITY_LABELS } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Priority config
const PRIORITY_CONFIG: Record<
  TaskPriority,
  { color: string; bg: string; icon: typeof AlertTriangle; order: number; border: string }
> = {
  urgent: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertTriangle,
    order: 0,
    border: 'border-l-red-500',
  },
  high: {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: ChevronUp,
    order: 1,
    border: 'border-l-orange-500',
  },
  medium: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: ChevronUp,
    order: 2,
    border: 'border-l-blue-400',
  },
  low: {
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
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
  onClick: (task: Task) => void;
  isSelected: boolean;
  isSelectMode: boolean;
  isOverlay?: boolean;
}

export function KanbanCard({ task, column, onPriorityChange, onClick, isSelected, isSelectMode, isOverlay }: KanbanCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priorityConfig.icon;
  const shortId = task.id.slice(0, 6).toUpperCase();

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
        'group relative rounded-lg border border-l-4 bg-card p-3 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing select-none',
        priorityConfig.border,
        isSelected
          ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
          : 'border-border',
        isDragging && !isOverlay && 'opacity-30 border-dashed scale-95 z-50',
        task.priority === 'urgent' && 'animate-pulse-slow'
      )}
      onClick={() => {
        if (transform) return;
        onClick(task);
      }}
    >
      {/* Urgent indicator */}
      {task.priority === 'urgent' && (
        <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm z-10">
          <AlertTriangle className="h-3 w-3" />
        </div>
      )}

      {/* Header: checkbox + title + menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* Checkbox (visible in select mode or when selected) */}
        {(isSelectMode || isSelected) && (
          <div className="shrink-0 mt-0.5">
            <div
              className={cn(
                'h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
                isSelected
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/40'
              )}
            >
              {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </div>
          </div>
        )}

        <div className="flex items-start gap-1 flex-1 min-w-0">
          <h4 className="text-xs font-semibold leading-tight line-clamp-2 flex-1">{task.title}</h4>
        </div>

        {/* 3-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="z-[200]">
            <DropdownMenuLabel className="text-xs">Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onClick(task);
              }}
            >
              Ver detalle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2 pl-5">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 pl-5">
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

      {/* Footer: priority + meta */}
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

        {/* Meta: id corto + comentarios + adjuntos + fecha */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-mono text-[9px] text-muted-foreground/60">#{shortId}</span>
          {task.commentCount > 0 && (
            <div className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="h-3 w-3" />
              <span>{task.commentCount}</span>
            </div>
          )}
          {task.attachmentUrls && task.attachmentUrls.length > 0 && (
            <div className="flex items-center gap-0.5 text-[10px]">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachmentUrls.length}</span>
            </div>
          )}
          {task.subtaskIds && task.subtaskIds.length > 0 && (
            <div className="flex items-center gap-0.5 text-[10px]">
              <CheckSquare className="h-3 w-3" />
              <span>{task.subtaskIds.length}</span>
            </div>
          )}
          {task.dueDate && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-[10px]',
                new Date(task.dueDate) < new Date() && task.status !== 'done'
                  ? 'text-red-500 font-semibold'
                  : ''
              )}
            >
              <Clock className="h-3 w-3" />
              <span>
                {new Date(task.dueDate).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                {(() => { const d = new Date(task.dueDate); return (d.getHours() !== 0 || d.getMinutes() !== 0) ? ` ${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}` : null; })()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Assignees */}
      {(() => {
        if (!task.assigneeIds || task.assigneeIds.length === 0) return null;
        const validAssignees = task.assigneeIds
          .map((id) => task.assignees?.find((x) => x.id === id))
          .filter((a): a is NonNullable<typeof a> => !!a);
        if (validAssignees.length === 0) return null;

        return (
          <div className="flex -space-x-2 mt-2 pt-2 border-t border-border/50">
            {validAssignees.slice(0, 4).map((a) => {
              const initials = a.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <Avatar key={a.id} className="h-5 w-5 border-2 border-card" title={a.name}>
                  {a.avatar && <AvatarImage src={a.avatar} alt={a.name} />}
                  <AvatarFallback className="text-[8px] bg-primary/10">{initials}</AvatarFallback>
                </Avatar>
              );
            })}
            {validAssignees.length > 4 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-medium border-2 border-card">
                +{validAssignees.length - 4}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
