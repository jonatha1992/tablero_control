import type { Task, TaskStatus, TaskPriority } from '@/types/domain/task';

/** Client-side filter state shared by the Agenda and Calendar views. */
export interface TaskFilterState {
  assigneeIds: string[];
  objectiveId: string;
  priority: TaskPriority | '';
  locationId: string;
  /** Statuses hidden from the view (e.g. ['done'] to hide completed tasks). */
  excludeStatuses: TaskStatus[];
}

export const EMPTY_TASK_FILTERS: TaskFilterState = {
  assigneeIds: [],
  objectiveId: '',
  priority: '',
  locationId: '',
  excludeStatuses: [],
};

export function hasActiveFilters(f: TaskFilterState): boolean {
  return (
    f.assigneeIds.length > 0 ||
    f.objectiveId !== '' ||
    f.priority !== '' ||
    f.locationId !== '' ||
    f.excludeStatuses.length > 0
  );
}

/** Pure predicate applied over the fetched task list (AND semantics). */
export function matchesTaskFilters(task: Task, f: TaskFilterState): boolean {
  if (f.assigneeIds.length > 0 && !task.assigneeIds.some((id) => f.assigneeIds.includes(id))) return false;
  if (f.objectiveId && task.objectiveId !== f.objectiveId) return false;
  if (f.priority && task.priority !== f.priority) return false;
  if (f.locationId && task.locationId !== f.locationId) return false;
  if (f.excludeStatuses.includes(task.status)) return false;
  return true;
}
