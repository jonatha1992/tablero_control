import { prisma } from '@/lib/prisma';
import type { ILocationRepository } from '../interfaces/ILocationRepository';
import type { Location, LocationStatus } from '@/types/domain/location';
import type { Prisma } from '@prisma/client';

type PrismaLocation = Prisma.LocationGetPayload<{
  include: { teams: true; tasks: { select: { id: true } } };
}>;

function toDomain(l: PrismaLocation): Location {
  return {
    id: l.id,
    businessId: l.businessId,
    name: l.name,
    type: l.type,
    description: l.description ?? undefined,
    address: l.address ?? undefined,
    managerId: l.managerId ?? undefined,
    teamIds: l.teams.map((t: { id: string }) => t.id),
    status: l.status as LocationStatus,
    operatingHours: l.operatingHours as Location['operatingHours'],
    metadata: (l.metadata ?? {}) as Record<string, unknown>,
    taskIds: l.tasks.map((t: { id: string }) => t.id),
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

const include = {
  teams: true,
  tasks: { select: { id: true } },
} satisfies Prisma.LocationInclude;

export class PrismaLocationRepository implements ILocationRepository {
  async findById(id: string): Promise<Location | null> {
    const l = await prisma.location.findUnique({ where: { id }, include });
    return l ? toDomain(l) : null;
  }

  async findByBusiness(businessId: string): Promise<Location[]> {
    const locs = await prisma.location.findMany({ where: { businessId }, include });
    return locs.map(toDomain);
  }

  async findByStatus(businessId: string, status: LocationStatus): Promise<Location[]> {
    const locs = await prisma.location.findMany({
      where: { businessId, status },
      include,
    });
    return locs.map(toDomain);
  }

  async create(data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    const { teamIds: _teamIds, taskIds: _taskIds, ...rest } = data;
    const l = await prisma.location.create({
      data: {
        ...rest,
        operatingHours: rest.operatingHours as Prisma.InputJsonValue | undefined,
        metadata: rest.metadata as Prisma.InputJsonValue,
      },
      include,
    });
    return toDomain(l);
  }

  async update(id: string, data: Partial<Location>): Promise<Location> {
    const { teamIds: _teamIds, taskIds: _taskIds, ...rest } = data;
    const l = await prisma.location.update({
      where: { id },
      data: {
        ...rest,
        operatingHours: rest.operatingHours as Prisma.InputJsonValue | undefined,
        metadata: rest.metadata as Prisma.InputJsonValue | undefined,
      },
      include,
    });
    return toDomain(l);
  }

  async delete(id: string): Promise<void> {
    await prisma.location.delete({ where: { id } });
  }
}
