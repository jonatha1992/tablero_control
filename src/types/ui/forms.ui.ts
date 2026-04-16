import type { TaskStatus, TaskPriority, TaskType } from '../domain/task';
import type { UserRole } from '../domain/user';

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  tags: string;
  dueDate: string;
  estimatedHours: string;
  locationId: string;
  assigneeIds: string[];
}

export interface UserFormValues {
  name: string;
  email: string;
  role: UserRole;
  phone: string;
}

export interface InviteMemberFormValues {
  name: string;
  email: string;
  role: UserRole;
}
