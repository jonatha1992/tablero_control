import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/members/leave/route';
import { teamService } from '@/services/team.service';
import { requireUser, invalidateAuthedUserCache } from '@/lib/api/auth-helpers';
import { userRepository, businessRepository } from '@/repositories';
import { getAdminAuth } from '@/lib/firebase/admin';
import { writeAuditLog } from '@/lib/api/audit';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  invalidateAuthedUserCache: vi.fn(),
}));

vi.mock('@/services/team.service', () => ({
  teamService: {
    leaveBusiness: vi.fn(),
    handleManagerDeletion: vi.fn(),
  },
}));

vi.mock('@/repositories', () => ({
  userRepository: {
    findById: vi.fn(),
    findActiveAdminOrSuperadminsByBusiness: vi.fn(),
  },
  businessRepository: { findById: vi.fn() },
  locationRepository: {},
  teamRepository: {},
}));

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(() => Promise.resolve()),
}));

const mockSetCustomUserClaims = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: vi.fn(() => ({ setCustomUserClaims: mockSetCustomUserClaims })),
}));

const mockRequireUser = vi.mocked(requireUser);
const mockFindUser = vi.mocked(userRepository.findById);
const mockFindBusiness = vi.mocked(businessRepository.findById);
const mockFindOtherAdmins = vi.mocked(userRepository.findActiveAdminOrSuperadminsByBusiness);
const mockLeaveBusiness = vi.mocked(teamService.leaveBusiness);
const mockHandleManagerDeletion = vi.mocked(teamService.handleManagerDeletion);
const mockInvalidateCache = vi.mocked(invalidateAuthedUserCache);
const mockGetAdminAuth = vi.mocked(getAdminAuth);
const mockWriteAuditLog = vi.mocked(writeAuditLog);

function member(overrides: Partial<{ role: string; businessId: string; memberships: unknown[] }> = {}) {
  return {
    id: 'user-1',
    name: 'Ana García',
    email: 'ana@biz.com',
    role: 'miembro',
    businessId: 'biz-1',
    memberships: [
      { id: 'mb-1', userId: 'user-1', businessId: 'biz-1', role: 'miembro', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ],
    teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  };
}

function authedUser(overrides: Partial<{ uid: string; role: string; businessId: string }> = {}) {
  return {
    uid: 'user-1',
    role: 'miembro',
    businessId: 'biz-1',
    email: 'ana@biz.com',
    data: { id: 'user-1', role: 'miembro', businessId: 'biz-1', name: 'Ana García', email: 'ana@biz.com', teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ...overrides,
  } as never;
}

function req() {
  return new NextRequest('http://localhost/api/members/leave', { method: 'POST' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSetCustomUserClaims.mockClear().mockResolvedValue(undefined);
  mockFindBusiness.mockResolvedValue({ id: 'biz-1', ownerId: 'owner-1' } as never);
});

describe('POST /api/members/leave', () => {
  it('400 no_business si el usuario no tiene negocio activo', async () => {
    mockRequireUser.mockResolvedValueOnce({
      uid: 'user-1',
      role: 'miembro',
      businessId: undefined,
      email: 'ana@biz.com',
      data: { id: 'user-1', role: 'miembro', businessId: undefined, name: 'Ana', email: 'ana@biz.com', teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    } as never);

    const res = await POST(req());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('no_business');
    expect(mockLeaveBusiness).not.toHaveBeenCalled();
  });

  it('404 not_member si no hay membresía activa en ese negocio', async () => {
    mockRequireUser.mockResolvedValueOnce(authedUser());
    mockFindUser.mockResolvedValueOnce(member({ memberships: [] }) as never);

    const res = await POST(req());
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('not_member');
    expect(mockLeaveBusiness).not.toHaveBeenCalled();
  });

  it('403 cannot_leave_owner si el que sale es el dueño del negocio', async () => {
    mockRequireUser.mockResolvedValueOnce(authedUser({ uid: 'owner-1' }));
    mockFindUser.mockResolvedValueOnce(member({
      memberships: [{ id: 'mb', userId: 'owner-1', businessId: 'biz-1', role: 'admin', isActive: true, createdAt: new Date(), updatedAt: new Date() }],
    }) as never);
    mockFindBusiness.mockResolvedValueOnce({ id: 'biz-1', ownerId: 'owner-1' } as never);

    const res = await POST(req());
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('cannot_leave_owner');
    expect(mockLeaveBusiness).not.toHaveBeenCalled();
  });

  it('409 last_admin_cannot_leave si es admin y no hay otro admin activo', async () => {
    mockRequireUser.mockResolvedValueOnce(authedUser());
    mockFindUser.mockResolvedValueOnce(member({
      memberships: [{ id: 'mb', userId: 'user-1', businessId: 'biz-1', role: 'admin', isActive: true, createdAt: new Date(), updatedAt: new Date() }],
    }) as never);
    mockFindOtherAdmins.mockResolvedValueOnce([]);

    const res = await POST(req());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('last_admin_cannot_leave');
    expect(mockLeaveBusiness).not.toHaveBeenCalled();
  });

  it('trata membresía superadmin como admin para el chequeo de último admin', async () => {
    mockRequireUser.mockResolvedValueOnce(authedUser());
    mockFindUser.mockResolvedValueOnce(member({
      memberships: [{ id: 'mb', userId: 'user-1', businessId: 'biz-1', role: 'superadmin', isActive: true, createdAt: new Date(), updatedAt: new Date() }],
    }) as never);
    mockFindOtherAdmins.mockResolvedValueOnce([]);

    const res = await POST(req());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('last_admin_cannot_leave');
  });

  it('200 admin con otro admin disponible: reasigna sectores y remueve membresía', async () => {
    mockRequireUser.mockResolvedValueOnce(authedUser());
    mockFindUser.mockResolvedValueOnce(member({
      memberships: [{ id: 'mb', userId: 'user-1', businessId: 'biz-1', role: 'admin', isActive: true, createdAt: new Date(), updatedAt: new Date() }],
    }) as never);
    mockFindOtherAdmins.mockResolvedValueOnce([{ id: 'other-admin' } as never]);
    mockLeaveBusiness.mockResolvedValueOnce(undefined);
    mockFindUser.mockResolvedValueOnce({ ...member(), role: 'miembro', memberships: [] } as never);

    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.remainingBusinesses).toBe(0);
    expect(mockLeaveBusiness).toHaveBeenCalledWith('user-1', 'biz-1', 'other-admin');
    expect(mockHandleManagerDeletion).not.toHaveBeenCalled();
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('user-1', { role: 'miembro', businessId: null });
    expect(mockInvalidateCache).toHaveBeenCalledWith('user-1');
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.leave', targetId: 'user-1', businessId: 'biz-1' })
    );
  });

  it('200 no-admin puede salir sin chequeo de último admin', async () => {
    mockRequireUser.mockResolvedValueOnce(authedUser());
    mockFindUser.mockResolvedValueOnce(member() as never);
    mockFindOtherAdmins.mockResolvedValueOnce([{ id: 'admin-a' } as never]);
    mockLeaveBusiness.mockResolvedValueOnce(undefined);
    mockFindUser.mockResolvedValueOnce({
      ...member(),
      memberships: [{ id: 'mb-2', userId: 'user-1', businessId: 'biz-2', role: 'miembro', isActive: true, createdAt: new Date(), updatedAt: new Date() }],
    } as never);

    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.remainingBusinesses).toBe(1);
    expect(mockLeaveBusiness).toHaveBeenCalledWith('user-1', 'biz-1', 'admin-a');
  });

  it('no-admin sin otro admin: reasigna sectores al dueño del negocio', async () => {
    mockRequireUser.mockResolvedValueOnce(authedUser());
    mockFindUser.mockResolvedValueOnce(member() as never);
    mockFindOtherAdmins.mockResolvedValueOnce([]);
    mockLeaveBusiness.mockResolvedValueOnce(undefined);
    mockFindUser.mockResolvedValueOnce({ ...member(), memberships: [] } as never);

    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(mockLeaveBusiness).toHaveBeenCalledWith('user-1', 'biz-1', 'owner-1');
  });

  it('no-admin, sin otro admin y sin ownerId (negocio no encontrado): sale con target null', async () => {
    mockRequireUser.mockResolvedValueOnce(authedUser());
    mockFindUser.mockResolvedValueOnce(member() as never);
    mockFindBusiness.mockResolvedValueOnce(null);
    mockFindOtherAdmins.mockResolvedValueOnce([]);
    mockLeaveBusiness.mockResolvedValueOnce(undefined);
    mockFindUser.mockResolvedValueOnce({ ...member(), memberships: [] } as never);

    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(mockLeaveBusiness).toHaveBeenCalledWith('user-1', 'biz-1', null);
  });

  it('setCustomUserClaims falla: no fatal, sigue devolviendo 200', async () => {
    mockRequireUser.mockResolvedValueOnce(authedUser());
    mockFindUser.mockResolvedValueOnce(member() as never);
    mockFindOtherAdmins.mockResolvedValueOnce([{ id: 'admin-a' } as never]);
    mockLeaveBusiness.mockResolvedValueOnce(undefined);
    mockFindUser.mockResolvedValueOnce({ ...member(), memberships: [] } as never);
    mockGetAdminAuth.mockReturnValueOnce({
      setCustomUserClaims: vi.fn().mockRejectedValueOnce(new Error('claims down')),
    } as never);

    const res = await POST(req());
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});
