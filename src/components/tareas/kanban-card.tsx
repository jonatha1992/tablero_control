'use client';

import { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  GripVertical,
  MessageSquare,
  Paperclip,
  Clock,
  MoreVertical,
  CheckSquare,
  AlertTriangle,
  ChevronUp,
} from 'lucide-react';
import { cn, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Priority config
const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string; icon: typeof AlertTriangle; order: number; border: string }> = {
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

// Task card component for Kanban board
interface KanbanCardProps {
  task: Task;
  column: TaskStatus;
  onMove: (taskId: string, from: TaskStatus, to: TaskStatus) => void;
  onPriorityChange: (taskId: string, newPriority: TaskPriority) => void;
  onClick: (task: Task) => void;
}

export function KanbanCard({ task, column, onMove, onPriorityChange, onClick }: KanbanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priorityConfig.icon;

  // Drag source
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id, from: column },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Drop target (for reordering within column)
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string; from: TaskStatus }) => {
      if (item.id !== task.id) {
        onMove(item.id, item.from, column);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  const handlePriorityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPriorityPicker(!showPriorityPicker);
  };

  const handlePrioritySelect = (e: React.MouseEvent, priority: TaskPriority) => {
    e.stopPropagation();
    onPriorityChange(task.id, priority);
    setShowPriorityPicker(false);
  };

  // Priority order: urgent > high > medium > low
  const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
  const currentPriorityIndex = priorities.indexOf(task.priority);
  const nextPriority = priorities[(currentPriorityIndex + 1) % priorities.length];

  return (
    <div
      ref={ref}
      className={cn(
        'group relative rounded-md border border-border border-l-4 bg-card p-3 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing',
        priorityConfig.border,
        isDragging && 'opacity-50 rotate-2',
        isOver && 'ring-2 ring-primary ring-offset-2',
        task.priority === 'urgent' && 'animate-pulse-slow'
      )}
      onClick={() => onClick(task)}
    >
      {/* Urgent indicator */}
      {task.priority === 'urgent' && (
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
          <AlertTriangle className="h-3 w-3" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0 group-hover:text-muted-foreground" />
          <h4 className="text-sm font-medium leading-tight line-clamp-2">{task.title}</h4>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
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

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Priority badge with click to change */}
        <div className="relative">
          <button
            onClick={handlePriorityClick}
            className={cn(
              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:opacity-80',
              priorityConfig.bg,
              priorityConfig.color
            )}
            title={`Prioridad: ${TASK_PRIORITY_LABELS[task.priority]} (clic para cambiar)`}
          >
            <PriorityIcon className="h-3 w-3" />
            {TASK_PRIORITY_LABELS[task.priority]}
          </button>

          {/* Priority picker dropdown */}
          {showPriorityPicker && (
            <div className="absolute bottom-full left-0 mb-1 rounded-md border bg-card shadow-lg p-1 z-10 min-w-[120px]">
              <p className="text-[10px] font-medium text-muted-foreground px-2 py-1 mb-1">Cambiar prioridad</p>
              {priorities.map((p) => {
                const config = PRIORITY_CONFIG[p];
                const Icon = config.icon;
                const isActive = p === task.priority;
                return (
                  <button
                    key={p}
                    onClick={(e) => handlePrioritySelect(e, p)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2 py-1 text-xs transition-colors',
                      isActive ? 'bg-muted font-semibold' : 'hover:bg-muted'
                    )}
                  >
                    <Icon className={cn('h-3 w-3', config.color)} />
                    <span className={config.color}>{TASK_PRIORITY_LABELS[p]}</span>
                    {isActive && <span className="ml-auto text-muted-foreground">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 text-muted-foreground">
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
          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-0.5 text-[10px]',
              new Date(task.dueDate) < new Date() && task.status !== 'done'
                ? 'text-red-500 font-semibold'
                : ''
            )}>
              <Clock className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString('es', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
          {task.subtaskIds && task.subtaskIds.length > 0 && (
            <div className="flex items-center gap-0.5 text-[10px]">
              <CheckSquare className="h-3 w-3" />
              <span>{task.subtaskIds.filter(() => true).length}/{task.subtaskIds.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Assignees */}
      {task.assigneeIds && task.assigneeIds.length > 0 && (
        <div className="flex -space-x-2 mt-2 pt-2 border-t">
          {task.assigneeIds.slice(0, 3).map((id, i) => (
            <Avatar key={id} className="h-5 w-5 border-2 border-card">
              <AvatarFallback className="text-[8px]">
                {String.fromCharCode(65 + i)}
              </AvatarFallback>
            </Avatar>
          ))}
          {task.assigneeIds.length > 3 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-medium border-2 border-card">
              +{task.assigneeIds.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
