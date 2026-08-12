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

export class LastActiveProjectError extends Error {
  constructor() {
    super('last_active_project');
    this.name = 'LastActiveProjectError';
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super('project_not_found');
    this.name = 'ProjectNotFoundError';
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
    const projects = await prisma.project.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tasks: true,
            cycles: true,
          },
        },
        tasks: {
          where: {
            deletedAt: null,
            status: { notIn: ['done', 'archived'] },
          },
          select: { id: true },
        },
      },
    });
    return projects.map(({ tasks, ...project }) => ({
      ...project,
      openTaskCount: tasks?.length ?? 0,
    }));
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
          where: { businessId: data.businessId, status: { not: 'archived' } },
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
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id }, select: { businessId: true, status: true } });
      if (!project) throw new ProjectNotFoundError();
      if (project.status === 'archived') {
        const existing = await tx.project.findUnique({ where: { id }, include: { _count: { select: { tasks: true } } } });
        if (!existing) throw new ProjectNotFoundError();
        return existing;
      }
      const activeCount = await tx.project.count({ where: { businessId: project.businessId, status: { not: 'archived' } } });
      if (activeCount <= 1) throw new LastActiveProjectError();
      return tx.project.update({ where: { id }, data: { status: 'archived' }, include: { _count: { select: { tasks: true } } } });
    }, { isolationLevel: 'Serializable' });
  }

  async restore(id: string, actorRole: string, businessPlan: PlanId) {
    const planConfig = actorRole === 'superadmin' ? null : await getEffectivePlanConfig(businessPlan);
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id }, select: { businessId: true, status: true } });
      if (!project) throw new ProjectNotFoundError();
      if (project.status !== 'archived') {
        const existing = await tx.project.findUnique({ where: { id }, include: { _count: { select: { tasks: true } } } });
        if (!existing) throw new ProjectNotFoundError();
        return existing;
      }
      const limit = planConfig?.limits.projects ?? -1;
      if (limit !== -1) {
        const current = await tx.project.count({ where: { businessId: project.businessId, status: { not: 'archived' } } });
        if (current >= limit) throw new ProjectLimitError(limit, current);
      }
      return tx.project.update({ where: { id }, data: { status: 'active' }, include: { _count: { select: { tasks: true } } } });
    }, { isolationLevel: 'Serializable' });
  }

  async delete(id: string) {
    return prisma.project.delete({ where: { id } });
  }
}

export const projectService = new ProjectService();
