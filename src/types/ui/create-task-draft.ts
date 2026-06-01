import type {
  ChecklistItem,
  RecurrenceConfig,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@/types/domain/task';

/** Pre-fill for CreateTaskModal (e.g. from Planificador preview). */
export interface CreateTaskDraft {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  tags?: string[];
  dueDate?: string;
  dueTime?: string;
  assigneeIds?: string[];
  locationId?: string;
  projectId?: string;
  projectIds?: string[];
  cycleId?: string;
  objectiveId?: string;
  estimatedHours?: number;
  checklist?: ChecklistItem[];
  subtasks?: string[];
  recurrence?: RecurrenceConfig | null;
}
