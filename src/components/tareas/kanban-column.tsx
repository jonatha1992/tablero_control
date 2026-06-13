'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn, TASK_STATUS_LABELS } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { KanbanCard } from './kanban-card';
import { ArrowUpDown, Check, Minus, Plus } from 'lucide-react';
import type { KanbanSortMode } from '@/types/ui/kanban.ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onCardClick: (task: Task) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onLocationChange?: (taskId: string, locationId: string | null) => void;
  onAddClick: () => void;
  selectedTaskIds: string[];
  isSelectMode: boolean;
  onSelectAll: (taskIds: string[]) => void;
  onBulkDelete?: (taskIds: string[]) => void;
  onDelete?: (taskId: string) => void;
  onToggleSelect: (taskId: string) => void;
  locations: { id: string; name: string }[];
  sortMode: KanbanSortMode;
  onSortModeChange: (mode: KanbanSortMode) => void;
}

export function KanbanColumn({ status, tasks, onCardClick, onPriorityChange, onLocationChange, onAddClick, selectedTaskIds, isSelectMode, onSelectAll, onBulkDelete: _onBulkDelete, onDelete, onToggleSelect, locations, sortMode, onSortModeChange }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const priorityOrder: Record<TaskPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const sortedTasks = [...tasks].sort(
    (a, b) =>
      (sortMode === 'priority'
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const getLocationName = (locationId: string | null | undefined) =>
    locationId ? (locations.find((l) => l.id === locationId)?.name ?? '') : '';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full w-[320px] shrink-0 rounded-md border bg-muted/30 transition-colors',
        isOver && 'bg-primary/5 border-primary/30'
      )}
    >
      {/* Column header — static, above scroll area */}
      <div className="shrink-0 flex items-center justify-between px-2 py-1.5 border-b bg-muted/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 min-w-0">
          {isSelectMode && tasks.length > 0 && (() => {
            const taskIds = tasks.map((t) => t.id);
            const selectedCount = taskIds.filter((id) => selectedTaskIds.includes(id)).length;
            const allSelected = selectedCount === tasks.length;
            const someSelected = selectedCount > 0 && !allSelected;
            return (
              <button
                onClick={() => onSelectAll(taskIds)}
                className={cn(
                  'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  allSelected
                    ? 'bg-primary border-primary'
                    : someSelected
                    ? 'bg-primary/40 border-primary/60'
                    : 'border-muted-foreground/40 hover:border-primary/60'
                )}
                title={allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
              >
                {allSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                {someSelected && <Minus className="h-2.5 w-2.5 text-primary-foreground" />}
              </button>
            );
          })()}
          <div className={cn('h-3 w-3 rounded-full shrink-0', {
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
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title={`Orden: ${sortMode === 'priority' ? 'prioridad' : 'fecha'}`}
                aria-label={`Ordenar columna ${TASK_STATUS_LABELS[status]}`}
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={sortMode}
                onValueChange={(value) => onSortModeChange(value as KanbanSortMode)}
              >
                <DropdownMenuRadioItem value="priority">
                  Por prioridad
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date">
                  Por fecha
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={onAddClick}
            className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-1 transition-all"
            aria-label={`Agregar tarea en ${TASK_STATUS_LABELS[status]}`}
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Scrollable tasks area */}
      <div className="overflow-y-auto flex-1 min-h-0">
        <div className="flex flex-col gap-2 p-1.5 min-h-[200px]">
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
              onLocationChange={onLocationChange}
              onDelete={onDelete}
              onToggleSelect={onToggleSelect}
              onClick={onCardClick}
              isSelected={selectedTaskIds.includes(task.id)}
              isSelectMode={isSelectMode}
              locationName={getLocationName(task.locationId)}
              locations={locations}
            />
          ))
        )}
        </div>
      </div>
    </div>
  );
}
