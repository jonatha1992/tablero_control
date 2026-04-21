import { prisma } from '@/lib/prisma';
import type { ITaskRepository } from '../interfaces/ITaskRepository';
import type { Task, TaskFilters, TaskSort, TaskStatus } from '@/types/domain/task';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/types/dto/task.dto';
import type { PaginatedResponse } from '@/types/api/responses';
import type { Prisma } from '@prisma/client';

type PrismaTask = Prisma.TaskGetPayload<{
  include: {
    assignees: { select: { id: true; name: true; avatar: true } };
    subtasks: { select: { id: true } };
    attachments: { select: { url: true } };
  };
}>;

function toDomain(t: PrismaTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    status: t.status as TaskStatus,
    priority: t.priority as Task['priority'],
    type: t.type as Task['type'],
    assigneeIds: t.assignees.map((a) => a.id),
    assignees: t.assignees.map((a) => ({ id: a.id, name: a.name, avatar: a.avatar ?? undefined })),
    creatorId: t.creatorId,
    projectId: t.projectId ?? undefined,
    locationId: t.locationId ?? undefined,
    parentId: t.parentId ?? undefined,
    tags: t.tags,
    startDate: t.startDate ?? undefined,
    dueDate: t.dueDate ?? undefined,
    completedDate: t.completedDate ?? undefined,
    estimatedHours: t.estimatedHours ?? undefined,
    actualHours: t.actualHours ?? undefined,
    recurrence: t.recurrence as unknown as Task['recurrence'],
    subtaskIds: t.subtasks.map((s: { id: string }) => s.id),
    attachmentUrls: t.attachments.map((a: { url: string }) => a.url),
    commentCount: t.commentCount,
    position: t.position,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

const include = {
  assignees: { select: { id: true, name: true, avatar: true } },
  subtasks: { select: { id: true } },
  attachments: { select: { url: true } },
} satisfies Prisma.TaskInclude;

function buildWhere(businessId: string, filters?: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {};

  if (businessId !== 'all') {
    where.OR = [
      { location: { businessId } },
      { project: { businessId } },
    ];
  }

  if (filters?.status?.length) where.status = { in: filters.status };
  if (filters?.priority?.length) where.priority = { in: filters.priority };
  if (filters?.locationId?.length) where.locationId = { in: filters.locationId };
  if (filters?.assigneeId?.length) {
    where.assignees = { some: { id: { in: filters.assigneeId } } };
  }
  if (filters?.projectId?.length) where.projectId = { in: filters.projectId };
  if (filters?.tags?.length) where.tags = { hasSome: filters.tags };
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.dueDateFrom || filters?.dueDateTo) {
    where.dueDate = {};
    if (filters.dueDateFrom) where.dueDate.gte = filters.dueDateFrom;
    if (filters.dueDateTo) where.dueDate.lte = filters.dueDateTo;
  }

  return where;
}

export class PrismaTaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Task | null> {
    const t = await prisma.task.findUnique({ where: { id }, include });
    return t ? toDomain(t) : null;
  }

  async findAll(businessId: string, filters?: TaskFilters, sort?: TaskSort): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: buildWhere(businessId, filters),
      orderBy: sort
        ? { [sort.field]: sort.direction }
        : { position: 'asc' },
      include,
    });
    return tasks.map(toDomain);
  }

  async findPaginated(
    businessId: string,
    page: number,
    pageSize: number,
    filters?: TaskFilters
  ): Promise<PaginatedResponse<Task>> {
    const where = buildWhere(businessId, filters);
    const [total, tasks] = await prisma.$transaction([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { position: 'asc' },
        include,
      }),
    ]);
    return {
      items: tasks.map(toDomain),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async findByLocation(locationId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({ where: { locationId }, include });
    return tasks.map(toDomain);
  }

  async create(
    data: CreateTaskDTO & { creatorId: string; businessId: string }
  ): Promise<Task> {
    const { assigneeIds, creatorId, ...rest } = data;
    const t = await prisma.task.create({
      data: {
        ...rest,
        creatorId,
        position: Date.now(),
        assignees: assigneeIds?.length
          ? { connect: assigneeIds.map((id) => ({ id })) }
          : undefined,
      },
      include,
    });
    return toDomain(t);
  }

  async update(id: string, data: UpdateTaskDTO): Promise<Task> {
    const { assigneeIds, ...rest } = data;
    const t = await prisma.task.update({
      where: { id },
      data: {
        ...rest,
        assignees: assigneeIds
          ? { set: assigneeIds.map((uid) => ({ id: uid })) }
          : undefined,
      },
      include,
    });
    return toDomain(t);
  }

  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    await prisma.task.update({ where: { id }, data: { status } });
  }

  async batchUpdatePositions(
    updates: { id: string; position: number; status: TaskStatus }[]
  ): Promise<void> {
    await prisma.$transaction(
      updates.map(({ id, position, status }) =>
        prisma.task.update({ where: { id }, data: { position, status } })
      )
    );
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }
}
