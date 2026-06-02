import { prisma } from '@/lib/prisma';

export async function getTaskBusinessId(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      businessId: true,
      project: { select: { businessId: true } },
      location: { select: { businessId: true } },
      creator: {
        select: {
          businessId: true,
          memberships: {
            where: { isActive: true },
            select: { businessId: true },
            take: 1,
          },
        },
      },
    },
  });
  return task?.businessId ?? task?.project?.businessId ?? task?.location?.businessId ?? null;
}

/**
 * Checks whether the task can be considered part of `businessId`.
 *
 * Prefers Task.businessId. Relation fallback stays only for legacy rows during rollout.
 */
export async function taskBelongsToBusiness(taskId: string, businessId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      businessId: true,
      project: { select: { businessId: true } },
      location: { select: { businessId: true } },
      creator: {
        select: {
          businessId: true,
          memberships: {
            where: { isActive: true },
            select: { businessId: true },
          },
        },
      },
    },
  });
  if (!task) return false;

  if (task.businessId === businessId) return true;
  if (task.project?.businessId === businessId) return true;
  if (task.location?.businessId === businessId) return true;
  return false;
}
