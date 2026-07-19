import { prisma } from '@/lib/prisma';
import { type ProjectStatus } from '@prisma/client';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';
import type { PlanId } from '@/types/domain/subscription';

export class ProjectLimitError extends Error {
  constructor(public readonly limit: number, public readonly current: number) {
    super('projects_limit_exceeded');
    this.name = 'ProjectLimitError';
  }
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  teamId?: string;
  businessId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  teamId?: string | null;
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

class ProjectService {
  async getByBusiness(businessId: string) {
    return prisma.project.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async getById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async create(data: CreateProjectInput, actorRole: string, businessPlan: PlanId) {
    // Enforce plan project limit (skip for superadmin)
    if (actorRole !== 'superadmin') {
      const planConfig = await getEffectivePlanConfig(businessPlan);
      const limit = planConfig.limits.projects;
      if (limit !== -1) {
        const current = await prisma.project.count({
          where: { businessId: data.businessId },
        });
        if (current >= limit) {
          throw new ProjectLimitError(limit, current);
        }
      }
    }

    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        teamId: data.teamId,
        businessId: data.businessId,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async update(id: string, data: UpdateProjectInput) {
    return prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.teamId !== undefined && { teamId: data.teamId }),
        ...(data.status !== undefined && { status: data.status as ProjectStatus }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async archive(id: string) {
    return prisma.project.update({
      where: { id },
      data: { status: 'archived' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async delete(id: string) {
    return prisma.project.delete({ where: { id } });
  }
}

export const projectService = new ProjectService();
