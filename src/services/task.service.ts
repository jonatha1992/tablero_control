import { taskRepository } from '@/repositories';
import type { Task, TaskFilters, TaskStatus } from '@/types/domain/task';
import type { CreateTaskDTO, UpdateTaskDTO, ReorderKanbanDTO } from '@/types/dto/task.dto';
import type { PaginatedResponse } from '@/types/api/responses';

export class TaskService {
  async createTask(
    dto: CreateTaskDTO,
    creatorId: string,
    businessId: string
  ): Promise<Task> {
    if (!dto.title.trim()) throw new Error('El título es requerido');
    return taskRepository.create({ ...dto, creatorId, businessId });
  }

  async getTasksByBusiness(businessId: string, filters?: TaskFilters): Promise<Task[]> {
    return taskRepository.findAll(businessId, filters);
  }

  async getTasksPaginated(
    businessId: string,
    page: number,
    pageSize: number,
    filters?: TaskFilters
  ): Promise<PaginatedResponse<Task>> {
    return taskRepository.findPaginated(businessId, page, pageSize, filters);
  }

  async getTaskById(id: string): Promise<Task | null> {
    return taskRepository.findById(id);
  }

  async updateTask(id: string, dto: UpdateTaskDTO): Promise<Task> {
    return taskRepository.update(id, dto);
  }

  async moveTask(taskId: string, newStatus: TaskStatus): Promise<void> {
    const updates: UpdateTaskDTO = { status: newStatus };
    if (newStatus === 'done') {
      updates.completedDate = new Date();
    }
    await taskRepository.update(taskId, updates);
  }

  async reorderKanban({ moves }: ReorderKanbanDTO): Promise<void> {
    return taskRepository.batchUpdatePositions(moves);
  }

  async deleteTask(id: string): Promise<void> {
    return taskRepository.delete(id);
  }
}

export const taskService = new TaskService();
