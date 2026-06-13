import type { TaskStatus, TaskPriority } from '../domain/task';

export type KanbanSortMode = 'priority' | 'date';

export type KanbanColumnSortModes = Record<TaskStatus, KanbanSortMode>;

export interface KanbanDragState {
  draggedTaskId: string | null;
  draggedFrom: TaskStatus | null;
  dragOverColumn: TaskStatus | null;
}

export interface KanbanUIFilters {
  searchQuery: string;
  priority: TaskPriority | '';
  locationId: string;
  objectiveId: string;
  cycleId: string;
}
