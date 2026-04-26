import type { Task, TaskFilters, TaskSort, TaskStatus } from '@/types/domain/task';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/types/dto/task.dto';
import type { PaginatedResponse } from '@/types/api/responses';

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findAll(businessId: string, filters?: TaskFilters, sort?: TaskSort): Promise<Task[]>;
  findPaginated(
    businessId: string,
    page: number,
    pageSize: number,
    filters?: TaskFilters
  ): Promise<PaginatedResponse<Task>>;
  findByLocation(locationId: string): Promise<Task[]>;
  findByCreator(creatorId: string, filters?: TaskFilters): Promise<Task[]>;
  create(data: CreateTaskDTO & { creatorId: string; businessId: string }): Promise<Task>;
  update(id: string, data: UpdateTaskDTO): Promise<Task>;
  updateStatus(id: string, status: TaskStatus): Promise<void>;
  batchUpdatePositions(
    updates: { id: string; position: number; status: TaskStatus }[]
  ): Promise<void>;
  delete(id: string): Promise<void>;
}
