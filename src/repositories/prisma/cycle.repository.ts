import { prisma } from '@/lib/prisma';
import type { ICycleRepository, CreateCycleDTO, UpdateCycleDTO } from '../interfaces/ICycleRepository';
import type { Cycle } from '@/types/domain/cycle';

function toDomain(c: Awaited<ReturnType<typeof prisma.cycle.findUnique>>): Cycle | null {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    goal: c.goal ?? undefined,
    teamId: c.teamId ?? undefined,
    businessId: c.businessId,
    status: c.status as Cycle['status'],
    startDate: c.startDate ?? undefined,
    endDate: c.endDate ?? undefined,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export class PrismaCycleRepository implements ICycleRepository {
  async findById(id: string): Promise<Cycle | null> {
    const c = await prisma.cycle.findUnique({ where: { id } });
    return toDomain(c);
  }

  async findByBusiness(businessId: string): Promise<Cycle[]> {
    const cycles = await prisma.cycle.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    return cycles.map((c) => toDomain(c)!).filter(Boolean);
  }

  async findActiveByBusiness(businessId: string): Promise<Cycle[]> {
    const cycles = await prisma.cycle.findMany({
      where: { businessId, status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    return cycles.map((c) => toDomain(c)!).filter(Boolean);
  }

  async create(data: CreateCycleDTO): Promise<Cycle> {
    const c = await prisma.cycle.create({ data });
    return toDomain(c)!;
  }

  async update(id: string, data: UpdateCycleDTO): Promise<Cycle> {
    const c = await prisma.cycle.update({ where: { id }, data });
    return toDomain(c)!;
  }

  async delete(id: string): Promise<void> {
    await prisma.cycle.delete({ where: { id } });
  }

  async assignTasks(cycleId: string, taskIds: string[]): Promise<void> {
    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { cycleId },
    });
  }

  async removeTasks(cycleId: string, taskIds: string[]): Promise<void> {
    await prisma.task.updateMany({
      where: { id: { in: taskIds }, cycleId },
      data: { cycleId: null },
    });
  }
}
