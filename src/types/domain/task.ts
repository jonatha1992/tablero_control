export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'feature' | 'bug' | 'improvement' | 'task' | 'documentation';

export interface RecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  dayOfWeek?: number;  // 0-6
  dayOfMonth?: number; // 1-31
  endDate?: Date;
  count?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskAssignee {
  id: string;
  name: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assigneeIds: string[];
  assignees?: TaskAssignee[];
  creatorId: string;
  businessId?: string;
  projectId?: string;
  locationId?: string;
  cycleId?: string;
  objectiveId?: string;
  parentId?: string;
  tags: string[];
  startDate?: Date;
  dueDate?: Date;
  completedDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  recurrence?: RecurrenceConfig;
  checklist: ChecklistItem[];
  subtaskIds: string[];
  subtasksCompleted: number;
  attachmentUrls: string[];
  attachments?: { url: string; name: string }[];
  commentCount: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  position: number;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  author?: { id: string; name: string; avatar?: string };
}

export interface TaskFilters {
  status?: TaskStatus[];
  excludeStatus?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  projectId?: string[];
  locationId?: string[];
  cycleId?: string[];
  noCycle?: boolean;
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

export interface TaskSort {
  field: keyof Task;
  direction: 'asc' | 'desc';
}
