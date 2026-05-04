import type { Objective, ObjectiveStatus } from '@/types/domain/objective';

export interface CreateObjectiveDTO {
  name: string;
  description?: string;
  color?: string;
  businessId: string;
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

export interface IObjectiveRepository {
  findById(id: string): Promise<Objective | null>;
  findByBusiness(businessId: string): Promise<Objective[]>;
  findActiveByBusiness(businessId: string): Promise<Objective[]>;
  create(data: CreateObjectiveDTO): Promise<Objective>;
  update(id: string, data: UpdateObjectiveDTO): Promise<Objective>;
  delete(id: string): Promise<void>;
  assignTasks(objectiveId: string, taskIds: string[]): Promise<void>;
  removeTasks(objectiveId: string, taskIds: string[]): Promise<void>;
}
