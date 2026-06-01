import { prisma } from '@/lib/prisma';

export async function getTaskBusinessId(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
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
  return (
    task?.project?.businessId ??
    task?.location?.businessId ??
    task?.creator?.businessId ??
    task?.creator?.memberships?.[0]?.businessId ??
    null
  );
}

/**
 * Checks whether the task can be considered part of `businessId`.
 *
 * NOTE: Tasks don't have a `businessId` column; tenant is inferred from relations.
 * We keep this function narrow and deterministic so all routes can share the same rule.
 */
export async function taskBelongsToBusiness(taskId: string, businessId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
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

  if (task.project?.businessId === businessId) return true;
  if (task.location?.businessId === businessId) return true;
  if (task.creator?.businessId === businessId) return true;
  if (task.creator?.memberships?.some((m) => m.businessId === businessId)) return true;
  return false;
}
