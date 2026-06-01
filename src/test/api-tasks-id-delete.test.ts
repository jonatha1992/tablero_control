import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/tasks/[id]/route';
import { requireActiveSubscription, requireUser } from '@/lib/api/auth-helpers';
import { taskService } from '@/services/task.service';
import { taskBelongsToBusiness, getTaskBusinessId } from '@/lib/api/task-business';
import { can } from '@/lib/permissions';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireActiveSubscription: vi.fn().mockReturnValue(null),
}));

vi.mock('@/services/task.service', () => ({
  taskService: {
    getTaskById: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

vi.mock('@/lib/api/audit', () => ({ writeAuditLog: vi.fn() }));
vi.mock('@/lib/notifications', () => ({ sendNotification: vi.fn() }));

vi.mock('@/lib/api/task-business', () => ({
  taskBelongsToBusiness: vi.fn(),
  getTaskBusinessId: vi.fn(),
}));

vi.mock('@/lib/permissions', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/permissions')>();
  return { ...mod, can: vi.fn() };
});

const mockRequireUser = vi.mocked(requireUser);
const mockRequireActiveSub = vi.mocked(requireActiveSubscription);
const mockGetTaskById = vi.mocked(taskService.getTaskById);
const mockDeleteTask = vi.mocked(taskService.deleteTask);
const mockBelongs = vi.mocked(taskBelongsToBusiness);
const mockGetBiz = vi.mocked(getTaskBusinessId);
const mockCan = vi.mocked(can);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue({
    uid: 'u-1',
    role: 'admin',
    businessId: 'biz-1',
    email: 'admin@biz.com',
    name: 'Admin',
    data: {
      id: 'u-1',
      role: 'admin',
      businessId: 'biz-1',
      memberships: [{ businessId: 'biz-1', isActive: true, role: 'admin' }],
    },
  } as never);
  mockCan.mockReturnValue(true);
  mockBelongs.mockResolvedValue(true);
  mockGetTaskById.mockResolvedValue({ id: 't-1', title: 'T', locationId: null, assigneeIds: [] } as never);
});

function makeReq(id: string) {
  return new NextRequest(`http://localhost/api/tasks/${id}`, { method: 'DELETE' });
}

describe('DELETE /api/tasks/[id]', () => {
  it('returns 200 and {ok:true} for admin', async () => {
    const res = await DELETE(makeReq('t-1'), { params: Promise.resolve({ id: 't-1' }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockDeleteTask).toHaveBeenCalledWith('t-1');
  });

  it('returns 403 with reason no_business_context when user.businessId missing', async () => {
    mockRequireUser.mockResolvedValueOnce({
      uid: 'u-1',
      role: 'admin',
      businessId: undefined,
      email: 'admin@biz.com',
      name: 'Admin',
      data: { id: 'u-1', role: 'admin', businessId: undefined },
    } as never);

    const res = await DELETE(makeReq('t-1'), { params: Promise.resolve({ id: 't-1' }) });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden', reason: 'no_business_context' });
  });

  it('returns 403 {error:forbidden, reason:tenant_mismatch} when task not in tenant', async () => {
    mockBelongs.mockResolvedValueOnce(false);
    mockGetBiz.mockResolvedValueOnce('biz-other');

    const res = await DELETE(makeReq('t-1'), { params: Promise.resolve({ id: 't-1' }) });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden', reason: 'tenant_mismatch' });
  });

  it('returns 404 when tenant cannot be inferred', async () => {
    mockBelongs.mockResolvedValueOnce(false);
    mockGetBiz.mockResolvedValueOnce(null);

    const res = await DELETE(makeReq('t-1'), { params: Promise.resolve({ id: 't-1' }) });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'No encontrada' });
  });

  it('returns 403 missing_permission when can(task.delete) is false', async () => {
    mockCan.mockReturnValueOnce(false);
    const res = await DELETE(makeReq('t-1'), { params: Promise.resolve({ id: 't-1' }) });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden', reason: 'missing_permission' });
    expect(mockDeleteTask).not.toHaveBeenCalled();
  });

  it('returns 403 wrong_location when task is in another sector', async () => {
    mockRequireUser.mockResolvedValueOnce({
      uid: 'u-1',
      role: 'responsable',
      businessId: 'biz-1',
      email: 'r@biz.com',
      name: 'Resp',
      data: {
        id: 'u-1',
        role: 'responsable',
        businessId: 'biz-1',
        memberships: [{ businessId: 'biz-1', isActive: true, role: 'responsable', locationId: 'loc-a' }],
      },
    } as never);
    mockGetTaskById.mockResolvedValueOnce({
      id: 't-1',
      title: 'T',
      locationId: 'loc-b',
      assigneeIds: [],
    } as never);

    const res = await DELETE(makeReq('t-1'), { params: Promise.resolve({ id: 't-1' }) });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden', reason: 'wrong_location' });
    expect(mockDeleteTask).not.toHaveBeenCalled();
  });

  it('returns 403 subscription_required when requireActiveSubscription denies', async () => {
    // Return a NextResponse directly (same shape as auth helper)
    const { NextResponse } = await import('next/server');
    mockRequireActiveSub.mockReturnValueOnce(
      NextResponse.json(
        { error: 'subscription_required', detail: 'Suscripción vencida. Renovar en /dashboard/billing' },
        { status: 403 },
      ) as never
    );

    const res = await DELETE(makeReq('t-1'), { params: Promise.resolve({ id: 't-1' }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('subscription_required');
  });
});

