import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/locations/[id]/route';
import { locationService } from '@/services/location.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { canMutateLocation } from '@/lib/permissions/location-access';
import { writeAuditLog } from '@/lib/api/audit';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireActiveSubscription: vi.fn().mockReturnValue(null),
}));

vi.mock('@/services/location.service', () => ({
  locationService: {
    getById: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  },
}));

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn(),
}));

vi.mock('@/lib/permissions/tenant-guard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/permissions/tenant-guard')>();
  return {
    ...actual,
    assertSameTenant: vi.fn(),
  };
});

vi.mock('@/lib/permissions/location-access', () => ({
  canMutateLocation: vi.fn().mockReturnValue(true),
}));

const mockRequireUser = vi.mocked(requireUser);
const mockGetById = vi.mocked(locationService.getById);
const mockArchive = vi.mocked(locationService.archive);
const mockCanMutateLocation = vi.mocked(canMutateLocation);
const mockWriteAuditLog = vi.mocked(writeAuditLog);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue({
    uid: 'user-1',
    role: 'admin',
    businessId: 'biz-1',
    email: 'admin@biz.com',
    name: 'Admin',
    data: { id: 'user-1', role: 'admin', businessId: 'biz-1' },
  } as never);
  mockGetById.mockResolvedValue({
    id: 'loc-1',
    businessId: 'biz-1',
    name: 'Sector A',
    status: 'active',
  } as never);
  mockCanMutateLocation.mockReturnValue(true);
});

describe('PATCH /api/locations/[id]', () => {
  it('archiva sector cuando body.action = archive', async () => {
    mockArchive.mockResolvedValueOnce({
      id: 'loc-1',
      businessId: 'biz-1',
      name: 'Sector A',
      status: 'closed',
    } as never);

    const req = new NextRequest('http://localhost/api/locations/loc-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'archive' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'loc-1' }) });

    expect(res.status).toBe(200);
    expect(mockArchive).toHaveBeenCalledWith('loc-1');
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: 'LOCATION',
        targetId: 'loc-1',
        metadata: expect.objectContaining({ action: 'archive' }),
      })
    );
  });
});
