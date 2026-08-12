import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/projects/[id]/route';
import { projectService } from '@/services/project.service';
import { requireUser, requireRole, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn().mockReturnValue(null),
  requireActiveSubscription: vi.fn().mockReturnValue(null),
}));

vi.mock('@/services/project.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/project.service')>();
  return {
    ...actual,
    projectService: {
      getById: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      restore: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn(),
}));

vi.mock('@/lib/permissions/tenant-guard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/permissions/tenant-guard')>();
  return {
    ...actual,
    assertResourceBelongsToBusiness: vi.fn(),
  };
});

const mockRequireUser = vi.mocked(requireUser);
const mockRequireRole = vi.mocked(requireRole);
const mockRequireActiveSubscription = vi.mocked(requireActiveSubscription);
const mockGetById = vi.mocked(projectService.getById);
const mockArchive = vi.mocked(projectService.archive);
const mockRestore = vi.mocked(projectService.restore);
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
  mockRequireRole.mockReturnValue(null);
  mockRequireActiveSubscription.mockReturnValue(null);
  mockGetById.mockResolvedValue({
    id: 'proj-1',
    name: 'Tablero A',
    businessId: 'biz-1',
    status: 'active',
  } as never);
});

describe('PATCH /api/projects/[id]', () => {
  it('archiva proyecto cuando body.action = archive', async () => {
    mockArchive.mockResolvedValueOnce({
      id: 'proj-1',
      name: 'Tablero A',
      businessId: 'biz-1',
      status: 'archived',
    } as never);

    const req = new NextRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'archive' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'proj-1' }) });

    expect(res.status).toBe(200);
    expect(mockArchive).toHaveBeenCalledWith('proj-1');
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: 'PROJECT',
        targetId: 'proj-1',
        metadata: expect.objectContaining({ action: 'archive' }),
      })
    );
  });

  it('restaura proyecto cuando body.action = restore', async () => {
    mockGetById.mockResolvedValueOnce({
      id: 'proj-1', name: 'Tablero A', businessId: 'biz-1', status: 'archived',
    } as never);
    mockRestore.mockResolvedValueOnce({
      id: 'proj-1', name: 'Tablero A', businessId: 'biz-1', status: 'active',
    } as never);

    const req = new NextRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'restore' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'proj-1' }) });

    expect(res.status).toBe(200);
    expect(mockRestore).toHaveBeenCalledWith('proj-1', 'admin', expect.any(String));
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ action: 'restore' }) })
    );
  });

  it('rechaza una acción desconocida', async () => {
    const req = new NextRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'destroy' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'proj-1' }) });

    expect(res.status).toBe(400);
    expect(mockArchive).not.toHaveBeenCalled();
    expect(mockRestore).not.toHaveBeenCalled();
  });
});
