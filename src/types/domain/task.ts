export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'feature' | 'bug' | 'improvement' | 'task' | 'documentation';

export interface RecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  endDate?: Date;
  count?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assigneeIds: string[];
  creatorId: string;
  businessId?: string;
  projectId?: string;
  locationId?: string;
  parentId?: string;
  tags: string[];
  startDate?: Date;
  dueDate?: Date;
  completedDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  recurrence?: RecurrenceConfig;
  subtaskIds: string[];
  attachmentUrls: string[];
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
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  projectId?: string[];
  locationId?: string[];
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

export interface TaskSort {
  field: keyof Task;
  direction: 'asc' | 'desc';
}
