import type { TaskPriority } from './task';

export interface TeamSettings {
  defaultTaskPriority: TaskPriority;
  workingHours: { start: string; end: string };
  sprintDuration: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  businessId?: string;
  memberIds: string[];
  leadId: string;
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}
