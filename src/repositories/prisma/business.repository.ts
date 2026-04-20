import { prisma } from '@/lib/prisma';
import type { Business, EntityType, TaskDefaults } from '@/types/domain/business';

export class PrismaBusinessRepository {
  async findById(id: string): Promise<Business | null> {
    const row = await prisma.business.findUnique({
      where: { id },
    });
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      plan: row.plan as any,
      status: row.status as any,
      logo: row.logo ?? undefined,
      adminId: row.adminId,
      locationIds: [], // Se cargan por relación si es necesario
      teamIds: [],
      entityType: row.entityType as EntityType,
      settings: row.settings as any,
      taskDefaults: row.taskDefaults as unknown as TaskDefaults,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async update(id: string, data: Partial<Business>): Promise<void> {
    await prisma.business.update({
      where: { id },
      data: {
        name: data.name,
        entityType: data.entityType as any,
        taskDefaults: data.taskDefaults as any,
        settings: data.settings as any,
      },
    });
  }
}
