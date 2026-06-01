import { prisma } from '@/lib/prisma';
import { DEFAULT_BOARD_NAME } from '@/lib/constants/default-board';

export { DEFAULT_BOARD_NAME } from '@/lib/constants/default-board';

/** Creates the default tablero if the espacio has none. Idempotent. */
export async function ensureDefaultBoard(businessId: string): Promise<void> {
  const count = await prisma.project.count({ where: { businessId } });
  if (count === 0) {
    await prisma.project.create({
      data: {
        name: DEFAULT_BOARD_NAME,
        businessId,
        status: 'active',
      },
    });
  }
}
