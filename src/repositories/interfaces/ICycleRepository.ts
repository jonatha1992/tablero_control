import type { Cycle, CycleStatus } from '@/types/domain/cycle';

export interface CreateCycleDTO {
  name: string;
  goal?: string;
  teamId?: string;
  businessId: string;
  status: CycleStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateCycleDTO {
  name?: string;
  goal?: string | null;
  teamId?: string | null;
  status?: CycleStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface ICycleRepository {
  findById(id: string): Promise<Cycle | null>;
  findByBusiness(businessId: string): Promise<Cycle[]>;
  findActiveByBusiness(businessId: string): Promise<Cycle[]>;
  create(data: CreateCycleDTO): Promise<Cycle>;
  update(id: string, data: UpdateCycleDTO): Promise<Cycle>;
  delete(id: string): Promise<void>;
  assignTasks(cycleId: string, taskIds: string[]): Promise<void>;
  removeTasks(cycleId: string, taskIds: string[]): Promise<void>;
}
