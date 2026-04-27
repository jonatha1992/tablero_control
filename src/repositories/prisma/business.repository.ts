import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { Business, BusinessStatus } from '@/types/domain/business';
import type { PlanId } from '@/types/domain/subscription';

export class PrismaBusinessRepository {
  async findById(id: string): Promise<Business | null> {
    const row = await prisma.business.findUnique({
      where: { id },
    });
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      plan: row.plan as PlanId,
      status: row.status as BusinessStatus,
      logo: row.logo ?? undefined,
      adminId: row.adminId,
      locationIds: [], // Relational fields logic for later
      teamIds: [],
      settings: row.settings as unknown as Business['settings'], // Json cast to BusinessSettings
      featureFlags: row.featureFlags as Record<string, boolean>,
      subscriptionId: row.subscriptionId ?? undefined,
      trialEndsAt: row.trialEndsAt ?? undefined,
      suspendedAt: row.suspendedAt ?? undefined,
      suspendedReason: row.suspendedReason ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async create(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business> {
    const row = await prisma.business.create({
      data: {
        name: data.name,
        adminId: data.adminId,
        plan: data.plan,
        status: data.status,
        settings: data.settings as Prisma.InputJsonValue,
        featureFlags: data.featureFlags as Prisma.InputJsonValue,
      },
    });
    
    return this.findById(row.id) as Promise<Business>;
  }

  async update(id: string, data: Partial<Business>): Promise<void> {
    const { ...rest } = data;
    await prisma.business.update({
      where: { id },
      data: {
        ...rest,
        settings: rest.settings as Prisma.InputJsonValue,
        featureFlags: rest.featureFlags as Prisma.InputJsonValue,
      } as Prisma.BusinessUpdateInput,
    });
  }
}
