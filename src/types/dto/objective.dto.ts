import type { ObjectiveStatus } from '../domain/objective';

export interface CreateObjectiveDTO {
  name: string;
  description?: string;
  color?: string;
  projectId?: string;
  targetDate?: Date;
}

export interface UpdateObjectiveDTO {
  name?: string;
  description?: string | null;
  color?: string;
  projectId?: string | null;
  targetDate?: Date | null;
  status?: ObjectiveStatus;
}

export interface AssignTasksToObjectiveDTO {
  taskIds: string[];
}
