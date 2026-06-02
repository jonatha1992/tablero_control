import { taskRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';
import {
  resolveProjectTargets,
  type ResolveProjectTargetsInput,
} from '@/lib/tasks/resolve-project-targets';
import type { Task, TaskFilters, TaskStatus, RecurrenceConfig } from '@/types/domain/task';
import type { CreateTaskDTO, UpdateTaskDTO, ReorderKanbanDTO } from '@/types/dto/task.dto';
import type { PaginatedResponse } from '@/types/api/responses';

class TaskService {
  async createTask(
    dto: CreateTaskDTO,
    creatorId: string,
    businessId: string
  ): Promise<Task> {
    if (!dto.title.trim()) throw new Error('El título es requerido');
    return taskRepository.create({ ...dto, creatorId, businessId });
  }

  async validateProjectIdsForBusiness(projectIds: string[], businessId: string): Promise<void> {
    const ids = [...new Set(projectIds.filter(Boolean))];
    if (ids.length === 0) return;
    const projects = await prisma.project.findMany({
      where: { id: { in: ids } },
      select: { id: true, businessId: true },
    });
    if (projects.length !== ids.length) {
      throw new Error('project_not_found');
    }
    for (const p of projects) {
      if (p.businessId !== businessId) {
        throw new Error('forbidden');
      }
    }
  }

  async validateLocationIdsForBusiness(locationIds: string[], businessId: string): Promise<void> {
    const ids = [...new Set(locationIds.filter(Boolean))];
    if (ids.length === 0) return;
    const locations = await prisma.location.findMany({
      where: { id: { in: ids } },
      select: { id: true, businessId: true },
    });
    if (locations.length !== ids.length) {
      throw new Error('location_not_found');
    }
    for (const l of locations) {
      if (l.businessId !== businessId) {
        throw new Error('forbidden');
      }
    }
  }

  async createTasksForProjects(
    dto: CreateTaskDTO,
    targets: ResolveProjectTargetsInput,
    creatorId: string,
    businessId: string,
  ): Promise<Task[]> {
    const projectTargets = resolveProjectTargets(targets);
    const concreteIds = projectTargets.filter((id): id is string => id != null);
    await this.validateProjectIdsForBusiness(concreteIds, businessId);

    const created: Task[] = [];
    for (const projectId of projectTargets) {
      const task = await this.createTask(
        { ...dto, projectId: projectId ?? undefined },
        creatorId,
        businessId,
      );
      created.push(task);
    }
    return created;
  }

  async getTasksByBusiness(businessId: string, filters?: TaskFilters): Promise<Task[]> {
    return taskRepository.findAll(businessId, filters);
  }

  async getTasksByCreator(creatorId: string, filters?: TaskFilters): Promise<Task[]> {
    return taskRepository.findByCreator(creatorId, filters);
  }

  async getSubtasks(parentId: string): Promise<Task[]> {
    return taskRepository.findSubtasks(parentId);
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

  async moveTask(taskId: string, newStatus: TaskStatus): Promise<Task | null> {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new Error('Tarea no encontrada');

    // #7: guard persistente. La ocurrencia genera su próxima UNA sola vez.
    // Mover a in_progress y re-finalizar ya no duplica (recurrenceSpawnedAt persiste).
    const alreadySpawned = !!task.recurrenceSpawnedAt;
    const updates: UpdateTaskDTO = { status: newStatus };
    if (newStatus === 'done') {
      updates.completedDate = new Date();
    }

    await taskRepository.update(taskId, updates);

    if (newStatus === 'done' && !alreadySpawned && task.recurrence) {
      if (this.isRecurrenceExhausted(task.recurrence)) return null;
      const nextTask = await this.createNextOccurrence(task);
      // #10: propagar groupId al origen si no lo tenía
      const patchOrigin: UpdateTaskDTO = { recurrenceSpawnedAt: new Date() };
      if (!task.recurrenceGroupId) patchOrigin.recurrenceGroupId = task.id;
      await taskRepository.update(taskId, patchOrigin);
      return nextTask;
    }

    return null;
  }

  private isRecurrenceExhausted(recurrence: RecurrenceConfig): boolean {
    if (recurrence.endDate) {
      const end = new Date(recurrence.endDate);
      if (end < new Date()) return true;
    }
    if (typeof recurrence.count === 'number' && recurrence.count <= 0) return true;
    return false;
  }

  private async createNextOccurrence(task: Task): Promise<Task> {
    const nextDueDate = this.calculateNextDate(task.dueDate || new Date(), task.recurrence!);
    
    const resetChecklist = (task.checklist ?? []).map((item) => ({ ...item, done: false }));

    // #10: propagar recurrenceGroupId (o crearlo desde la tarea origen).
    const groupId = task.recurrenceGroupId ?? task.id;

    const dto: CreateTaskDTO = {
      title: task.title,
      description: task.description,
      status: 'todo',
      priority: task.priority,
      type: task.type,
      assigneeIds: task.assigneeIds,
      projectId: task.projectId,
      locationId: task.locationId,
      cycleId: task.cycleId,
      objectiveId: task.objectiveId,
      tags: task.tags,
      dueDate: nextDueDate,
      recurrence: this.decrementRecurrenceCount(task.recurrence!) as RecurrenceConfig,
      recurrenceGroupId: groupId,
      checklist: resetChecklist.length > 0 ? resetChecklist : undefined,
    };

    const businessId = task.businessId;
    if (!businessId) throw new Error('La tarea no tiene businessId');

    return this.createTask(dto, task.creatorId, businessId);
  }


  private decrementRecurrenceCount(recurrence: RecurrenceConfig): RecurrenceConfig {
    if (typeof recurrence.count === 'number') {
      return { ...recurrence, count: recurrence.count - 1 };
    }
    return recurrence;
  }

  private calculateNextDate(current: Date, config: { interval?: number; frequency?: string; dayOfWeek?: number; dayOfMonth?: number }): Date {
    const date = new Date(current);
    const interval = config.interval || 1;
    
    switch (config.frequency) {
      case 'daily':
        date.setDate(date.getDate() + interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (interval * 7));
        if (config.dayOfWeek !== undefined) {
          const diff = (config.dayOfWeek + 7 - date.getDay()) % 7;
          date.setDate(date.getDate() + diff);
        }
        break;
      case 'biweekly':
        date.setDate(date.getDate() + (interval * 14));
        if (config.dayOfWeek !== undefined) { // B3: respetar día elegido (#9)
          const diff = (config.dayOfWeek + 7 - date.getDay()) % 7;
          date.setDate(date.getDate() + diff);
        }
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + interval);
        if (config.dayOfMonth !== undefined) {
          date.setDate(config.dayOfMonth);
        }
        break;
    }
    return date;
  }

  async reorderKanban({ moves }: ReorderKanbanDTO): Promise<void> {
    return taskRepository.batchUpdatePositions(moves);
  }

  /** #8: soft-delete. */
  async deleteTask(id: string, deletedBy?: string): Promise<void> {
    return taskRepository.delete(id, deletedBy);
  }

  async restoreTask(id: string): Promise<void> {
    return taskRepository.restore(id);
  }

  async hardDeleteTask(id: string): Promise<void> {
    return taskRepository.hardDelete(id);
  }

  async getDeletedTasks(businessId: string) {
    return taskRepository.findDeleted(businessId);
  }
}

export const taskService = new TaskService();
