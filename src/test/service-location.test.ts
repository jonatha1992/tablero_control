import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/repositories', () => ({
  locationRepository: {
    findByBusiness: vi.fn(),
    findByStatus: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockTaskDeleteMany = vi.fn();
const mockLocationDelete = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
      callback({
        task: { deleteMany: mockTaskDeleteMany },
        location: { delete: mockLocationDelete },
      })
    ),
  },
}));

import { locationRepository } from '@/repositories';
import { locationService } from '@/services/location.service';
import { prisma } from '@/lib/prisma';

const mockLocationRepository = vi.mocked(locationRepository);
const mockTransaction = vi.mocked(prisma.$transaction);

describe('LocationService.archive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marca sector como closed', async () => {
    const archived = { id: 'loc-1', businessId: 'biz-1', name: 'Sector A', status: 'closed' };
    mockLocationRepository.update.mockResolvedValueOnce(archived as never);

    const result = await locationService.archive('loc-1');

    expect(result.status).toBe('closed');
    expect(mockLocationRepository.update).toHaveBeenCalledWith(
      'loc-1',
      expect.objectContaining({ status: 'closed' })
    );
  });
});

describe('LocationService.delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('elimina tareas del sector antes de borrar sector, dentro de transacción', async () => {
    await locationService.delete('loc-1');

    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockTaskDeleteMany).toHaveBeenCalledWith({ where: { locationId: 'loc-1' } });
    expect(mockLocationDelete).toHaveBeenCalledWith({ where: { id: 'loc-1' } });
    expect(mockTaskDeleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      mockLocationDelete.mock.invocationCallOrder[0]
    );
    expect(mockLocationRepository.delete).not.toHaveBeenCalled();
  });
});
