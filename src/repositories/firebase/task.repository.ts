import { where, orderBy, type QueryConstraint } from 'firebase/firestore';
import {
  getById,
  getAll,
  create,
  update,
  remove,
  batchUpdate,
  getPaginated,
} from '@/lib/firebase/firestore';
import type { ITaskRepository } from '../interfaces/ITaskRepository';
import type { Task, TaskFilters, TaskSort, TaskStatus } from '@/types/domain/task';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/types/dto/task.dto';
import type { PaginatedResponse } from '@/types/api/responses';

const COLLECTION = 'tasks';

export class FirebaseTaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Task | null> {
    return getById<Task>(COLLECTION, id);
  }

  async findAll(businessId: string, filters?: TaskFilters, sort?: TaskSort): Promise<Task[]> {
    const constraints: QueryConstraint[] = [];

    // Superadmin bypass: si es 'all', no filtramos por businessId
    if (businessId !== 'all') {
      constraints.push(where('businessId', '==', businessId));
    }

    if (filters?.status?.length) {
      constraints.push(where('status', 'in', filters.status));
    }
    if (filters?.priority?.length) {
      constraints.push(where('priority', 'in', filters.priority));
    }
    if (filters?.locationId?.length) {
      constraints.push(where('locationId', 'in', filters.locationId));
    }

    const sortField = sort?.field ?? 'position';
    const sortDir = sort?.direction ?? 'asc';
    constraints.push(orderBy(sortField as string, sortDir));

    return getAll<Task>(COLLECTION, constraints);
  }

  async findPaginated(
    businessId: string,
    page: number,
    pageSize: number,
    filters?: TaskFilters
  ): Promise<PaginatedResponse<Task>> {
    const paginationFilters: TaskFilters & { businessId?: string } = { ...filters };
    if (businessId !== 'all') {
      paginationFilters.businessId = businessId;
    }

    return getPaginated<Task>(COLLECTION, {
      page,
      pageSize,
      filters: paginationFilters,
    });
  }

  async findByLocation(locationId: string): Promise<Task[]> {
    return getAll<Task>(COLLECTION, [where('locationId', '==', locationId)]);
  }

  async create(
    data: CreateTaskDTO & { creatorId: string; businessId: string }
  ): Promise<Task> {
    const payload = {
      ...data,
      subtaskIds: [],
      attachmentUrls: [],
      commentCount: 0,
      position: Date.now(),
    };
    const id = await create(COLLECTION, payload);
    return { id, ...payload } as unknown as Task;
  }

  async update(id: string, data: UpdateTaskDTO): Promise<Task> {
    await update(COLLECTION, id, data as Record<string, unknown>);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Task ${id} not found after update`);
    return updated;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    await update(COLLECTION, id, { status });
  }

  async batchUpdatePositions(
    updates: { id: string; position: number; status: TaskStatus }[]
  ): Promise<void> {
    await batchUpdate(
      COLLECTION,
      updates.map((u) => ({ id: u.id, data: { position: u.position, status: u.status } }))
    );
  }

  async delete(id: string): Promise<void> {
    return remove(COLLECTION, id);
  }
}
