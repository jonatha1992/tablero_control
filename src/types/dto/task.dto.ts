import type { TaskStatus, TaskPriority, TaskType, RecurrenceConfig, ChecklistItem } from '../domain/task';

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assigneeIds: string[];
  projectId?: string;
  locationId?: string;
  cycleId?: string;
  tags: string[];
  dueDate?: Date;
  estimatedHours?: number;
  recurrence?: RecurrenceConfig;
  checklist?: ChecklistItem[];
}

export type UpdateTaskDTO = Partial<Omit<CreateTaskDTO, 'locationId' | 'projectId'>> & {
  completedDate?: Date;
  actualHours?: number;
  position?: number;
  attachmentUrls?: string[];
  title?: string;
  description?: string;
  locationId?: string | null;
  projectId?: string | null;
  cycleId?: string | null;
  objectiveId?: string | null;
  parentId?: string | null;
  checklist?: ChecklistItem[];
};

export interface MoveTaskDTO {
  taskId: string;
  newStatus: TaskStatus;
  position?: number;
}

export interface ReorderKanbanDTO {
  moves: { id: string; status: TaskStatus; position: number }[];
}
