import type { TaskStatus, TaskPriority } from '../domain/task';

export interface KanbanDragState {
  draggedTaskId: string | null;
  draggedFrom: TaskStatus | null;
  dragOverColumn: TaskStatus | null;
}

export interface KanbanUIFilters {
  searchQuery: string;
  priority: TaskPriority | '';
  locationId: string;
}
