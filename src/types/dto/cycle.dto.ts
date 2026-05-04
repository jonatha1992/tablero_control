import type { CycleStatus } from '../domain/cycle';

export interface CreateCycleDTO {
  name: string;
  goal?: string;
  teamId?: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateCycleDTO {
  name?: string;
  goal?: string;
  teamId?: string | null;
  status?: CycleStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface AssignTasksToCycleDTO {
  taskIds: string[];
}
