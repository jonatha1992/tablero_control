import { prisma } from '@/lib/prisma';
import type { IObjectiveRepository, CreateObjectiveDTO, UpdateObjectiveDTO } from '../interfaces/IObjectiveRepository';
import type { Objective } from '@/types/domain/objective';

function toDomain(o: Awaited<ReturnType<typeof prisma.objective.findUnique>>): Objective | null {
  if (!o) return null;
  return {
    id: o.id,
    name: o.name,
    description: o.description ?? undefined,
    color: o.color,
    businessId: o.businessId,
    projectId: o.projectId ?? undefined,
    targetDate: o.targetDate ?? undefined,
    status: o.status as Objective['status'],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export class PrismaObjectiveRepository implements IObjectiveRepository {
  async findById(id: string): Promise<Objective | null> {
    const o = await prisma.objective.findUnique({ where: { id } });
    return toDomain(o);
  }

  async findByBusiness(businessId: string): Promise<Objective[]> {
    const objectives = await prisma.objective.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    return objectives.map((o) => toDomain(o)!).filter(Boolean);
  }

  async findActiveByBusiness(businessId: string): Promise<Objective[]> {
    const objectives = await prisma.objective.findMany({
      where: { businessId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    return objectives.map((o) => toDomain(o)!).filter(Boolean);
  }

  async create(data: CreateObjectiveDTO): Promise<Objective> {
    const o = await prisma.objective.create({ data });
    return toDomain(o)!;
  }

  async update(id: string, data: UpdateObjectiveDTO): Promise<Objective> {
    const o = await prisma.objective.update({ where: { id }, data });
    return toDomain(o)!;
  }

  async delete(id: string): Promise<void> {
    await prisma.objective.delete({ where: { id } });
  }

  async assignTasks(objectiveId: string, taskIds: string[]): Promise<void> {
    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { objectiveId },
    });
  }

  async removeTasks(objectiveId: string, taskIds: string[]): Promise<void> {
    await prisma.task.updateMany({
      where: { id: { in: taskIds }, objectiveId },
      data: { objectiveId: null },
    });
  }
}
