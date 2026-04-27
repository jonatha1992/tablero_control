import { prisma } from '@/lib/prisma';
import { PLANS, type PlanDefinition } from './plans';
import type { PlanId } from '@/types/domain/subscription';

export async function getEffectivePlanConfig(planId: PlanId): Promise<PlanDefinition> {
  const row = await prisma.planConfig.findUnique({ where: { planId } });
  if (!row) return PLANS[planId];

  return {
    ...PLANS[planId],
    priceMonthly: row.priceMonthly,
    priceYearly: row.priceYearly,
    limits: {
      users: row.limitUsers,
      locations: row.limitLocations,
      projects: row.limitProjects,
      attachmentsPerMonth: row.limitAttachments,
    },
  };
}

export async function getAllEffectivePlanConfigs(): Promise<PlanDefinition[]> {
  const rows = await prisma.planConfig.findMany();
  const rowMap = Object.fromEntries(rows.map((r) => [r.planId, r]));

  return (['free', 'basic', 'pro', 'enterprise'] as PlanId[]).map((id) => {
    const row = rowMap[id];
    if (!row) return PLANS[id];
    return {
      ...PLANS[id],
      priceMonthly: row.priceMonthly,
      priceYearly: row.priceYearly,
      limits: {
        users: row.limitUsers,
        locations: row.limitLocations,
        projects: row.limitProjects,
        attachmentsPerMonth: row.limitAttachments,
      },
    };
  });
}
