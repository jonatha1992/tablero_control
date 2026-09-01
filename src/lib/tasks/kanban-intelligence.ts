import type { TaskStatus } from '@/types/domain/task';
import type { CreateTaskDraft } from '@/types/ui/create-task-draft';

export const KANBAN_COLUMN_ORDER: TaskStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
  'blocked',
  'archived',
];

export const DEFAULT_KANBAN_COLUMNS: TaskStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'done',
];

export function visibleKanbanColumns(
  activeColumns: TaskStatus[],
  viewMode: 'board' | 'backlog',
): TaskStatus[] {
  if (viewMode === 'backlog') return ['backlog'];
  return KANBAN_COLUMN_ORDER.filter((column) => activeColumns.includes(column));
}

export function buildSmartCreateDraft(input: {
  columnStatus?: TaskStatus;
  viewMode: 'board' | 'backlog';
  selectedSprintId: string | null;
  objectiveId?: string;
  locationId?: string;
  projectId?: string;
}): CreateTaskDraft {
  const status: TaskStatus =
    input.columnStatus ?? (input.viewMode === 'backlog' ? 'backlog' : 'todo');
  const isBacklog = status === 'backlog';

  return {
    status,
    dueDate: isBacklog ? '' : undefined,
    cycleId: !isBacklog && input.selectedSprintId ? input.selectedSprintId : '',
    objectiveId: input.objectiveId || undefined,
    locationId: input.locationId || undefined,
    projectId: input.projectId || undefined,
  };
}
