'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn, TASK_STATUS_LABELS } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { KanbanCard } from './kanban-card';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onCardClick: (task: Task) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onAddClick: () => void;
}

export function KanbanColumn({ status, tasks, onCardClick, onPriorityChange, onAddClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  // Sort tasks by priority within column
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[280px] min-w-[280px] max-w-[280px] shrink-0 rounded-md border bg-muted/30 transition-colors h-full',
        isOver && 'bg-primary/5 border-primary/30'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-1.5 border-b">
        <div className="flex items-center gap-2">
          <div className={cn('h-3 w-3 rounded-full', {
            'bg-gray-400': status === 'backlog',
            'bg-blue-500': status === 'todo',
            'bg-yellow-500': status === 'in_progress',
            'bg-purple-500': status === 'in_review',
            'bg-green-500': status === 'done',
            'bg-red-500': status === 'blocked',
          })} />
          <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h3>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-1 transition-all"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Tasks list */}
      <div className="flex flex-col gap-2 p-1.5 overflow-y-auto flex-1 min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
            <p>Sin tareas</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              column={status}
              onMove={() => { }}
              onPriorityChange={onPriorityChange}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
