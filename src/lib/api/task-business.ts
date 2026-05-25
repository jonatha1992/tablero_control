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
