import { prisma } from '@/lib/prisma';
import type { ITeamRepository } from '../interfaces/ITeamRepository';
import type { Team } from '@/types/domain/team';
import type { Prisma } from '@prisma/client';

type PrismaTeam = Prisma.TeamGetPayload<{ include: { members: true } }>;

function toDomain(t: PrismaTeam): Team {
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? undefined,
    businessId: t.businessId ?? undefined,
    leadId: t.leadId,
    memberIds: t.members.map((m: { userId: string }) => m.userId),
    settings: t.settings as unknown as Team['settings'],
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

const include = { members: true } satisfies Prisma.TeamInclude;

export class PrismaTeamRepository implements ITeamRepository {
  async findById(id: string): Promise<Team | null> {
    const t = await prisma.team.findUnique({ where: { id }, include });
    return t ? toDomain(t) : null;
  }

  async findByBusiness(businessId: string): Promise<Team[]> {
    const teams = await prisma.team.findMany({ where: { businessId }, include });
    return teams.map(toDomain);
  }

  async create(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const { memberIds, ...rest } = data;
    const t = await prisma.team.create({
      data: {
        ...rest,
        settings: rest.settings as unknown as Prisma.InputJsonValue,
        members: memberIds?.length
          ? { create: memberIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include,
    });
    return toDomain(t);
  }

  async update(id: string, data: Partial<Team>): Promise<Team> {
    const { ...rest } = data;
    const t = await prisma.team.update({
      where: { id },
      data: {
        ...rest,
        settings: rest.settings
          ? (rest.settings as unknown as Prisma.InputJsonValue)
          : undefined,
      },
      include,
    });
    return toDomain(t);
  }

  async addMember(teamId: string, userId: string): Promise<void> {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.team.delete({ where: { id } });
  }
}
