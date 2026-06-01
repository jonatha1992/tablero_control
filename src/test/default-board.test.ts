import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { ensureDefaultBoard, DEFAULT_BOARD_NAME } from '@/lib/default-board';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('ensureDefaultBoard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea tablero Principal si el espacio no tiene proyectos', async () => {
    vi.mocked(prisma.project.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.project.create).mockResolvedValueOnce({ id: 'p1' } as never);

    await ensureDefaultBoard('biz-1');

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        name: DEFAULT_BOARD_NAME,
        businessId: 'biz-1',
        status: 'active',
      },
    });
  });

  it('no crea tablero si ya existe al menos uno', async () => {
    vi.mocked(prisma.project.count).mockResolvedValueOnce(1);

    await ensureDefaultBoard('biz-1');

    expect(prisma.project.create).not.toHaveBeenCalled();
  });
});
