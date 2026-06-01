import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, PATCH } from '@/app/api/members/[id]/route';
import { teamService } from '@/services/team.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { userRepository, businessRepository } from '@/repositories';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn().mockReturnValue(null),
  requireActiveSubscription: vi.fn().mockReturnValue(null),
}));

vi.mock('@/services/team.service', () => ({
  teamService: {
    removeMember: vi.fn(),
    reactivateMember: vi.fn(),
    changeRole: vi.fn(),
    updateMember: vi.fn(),
    handleManagerDeletion: vi.fn(),
  },
}));

vi.mock('@/repositories', () => ({
  userRepository: { findById: vi.fn(), addMembership: vi.fn() },
  businessRepository: { findById: vi.fn() },
  teamRepository: {},
  locationRepository: {},
}));

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(() => Promise.resolve()),
}));

const mockRequireUser = vi.mocked(requireUser);
const mockFindUser = vi.mocked(userRepository.findById);
const mockFindBusiness = vi.mocked(businessRepository.findById);
const mockRemoveMember = vi.mocked(teamService.removeMember);

// Miembro multi-negocio: su negocio activo es biz-2 (no biz-1 del admin)
const multiBusinessMember = {
  id: 'mem-multi',
  name: 'Jonathan Correa',
  email: 'jonathan@example.com',
  role: 'miembro',
  businessId: 'biz-2',  // ← activo en OTRO negocio
  memberships: [
    { id: 'mb-1', userId: 'mem-multi', businessId: 'biz-1', role: 'miembro', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'mb-2', userId: 'mem-multi', businessId: 'biz-2', role: 'admin', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ],
  teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date(),
};

const regularMember = {
  id: 'mem-1',
  name: 'Ana García',
  email: 'ana@biz.com',
  role: 'miembro',
  businessId: 'biz-1',
  memberships: [
    { id: 'mb-3', userId: 'mem-1', businessId: 'biz-1', role: 'miembro', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ],
  teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue({
    uid: 'admin-1',
    role: 'admin',
    businessId: 'biz-1',
    email: 'admin@biz.com',
    name: 'Admin Opel',
    data: { id: 'admin-1', role: 'admin', businessId: 'biz-1', name: 'Admin Opel', email: 'admin@biz.com', teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  } as never);
  mockFindBusiness.mockResolvedValue({ id: 'biz-1', ownerId: 'owner-1' } as never);
});

// ─── DELETE /api/members/[id] ─────────────────────────────────────────────────

describe('DELETE /api/members/[id]', () => {

  it('elimina miembro normal correctamente', async () => {
    mockFindUser.mockResolvedValueOnce(regularMember as never);
    mockRemoveMember.mockResolvedValueOnce(undefined);

    const req = new NextRequest('http://localhost/api/members/mem-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'mem-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockRemoveMember).toHaveBeenCalledWith('mem-1', 'biz-1');
  });

  it('elimina miembro multi-negocio usando businessId del admin (no el activo del miembro)', async () => {
    // Jonathan tiene businessId='biz-2' como activo, pero tiene membresía activa en biz-1
    mockFindUser.mockResolvedValueOnce(multiBusinessMember as never);
    mockRemoveMember.mockResolvedValueOnce(undefined);

    const req = new NextRequest('http://localhost/api/members/mem-multi', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'mem-multi' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // Debe usar biz-1 (negocio del admin), no biz-2 (negocio activo del miembro)
    expect(mockRemoveMember).toHaveBeenCalledWith('mem-multi', 'biz-1');
  });

  it('retorna 404 si el miembro no tiene membresía activa en el negocio del admin', async () => {
    const memberOtherBusiness = {
      ...regularMember,
      id: 'mem-other',
      businessId: 'biz-99',
      memberships: [
        { id: 'mb-x', userId: 'mem-other', businessId: 'biz-99', role: 'miembro', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ],
    };
    mockFindUser.mockResolvedValueOnce(memberOtherBusiness as never);

    const req = new NextRequest('http://localhost/api/members/mem-other', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'mem-other' }) });

    expect(res.status).toBe(404);
    expect(mockRemoveMember).not.toHaveBeenCalled();
  });

  it('retorna 400 al intentar eliminarse a sí mismo', async () => {
    mockRequireUser.mockResolvedValueOnce({
      uid: 'admin-1',
      role: 'admin',
      businessId: 'biz-1',
      email: 'admin@biz.com',
      name: 'Admin Opel',
      data: { id: 'admin-1', role: 'admin', businessId: 'biz-1', name: 'Admin Opel', email: 'admin@biz.com', teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    } as never);

    const req = new NextRequest('http://localhost/api/members/admin-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'admin-1' }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('cannot_remove_self');
    expect(mockRemoveMember).not.toHaveBeenCalled();
  });

  it('retorna 403 al intentar eliminar al propietario del negocio', async () => {
    const ownerMember = {
      ...regularMember,
      id: 'owner-1',
      memberships: [
        { id: 'mb-owner', userId: 'owner-1', businessId: 'biz-1', role: 'admin', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ],
    };
    mockFindUser.mockResolvedValueOnce(ownerMember as never);

    const req = new NextRequest('http://localhost/api/members/owner-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'owner-1' }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('cannot_remove_owner');
    expect(mockRemoveMember).not.toHaveBeenCalled();
  });

  it('retorna 404 si el usuario no existe', async () => {
    mockFindUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/members/no-existe', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'no-existe' }) });

    expect(res.status).toBe(404);
    expect(mockRemoveMember).not.toHaveBeenCalled();
  });

  it('permite eliminar miembro al propietario del negocio aunque su rol no sea admin', async () => {
    mockRequireUser.mockResolvedValueOnce({
      uid: 'owner-1',
      role: 'miembro',
      businessId: 'biz-1',
      email: 'owner@biz.com',
      name: 'Dueño',
      data: {
        id: 'owner-1',
        role: 'miembro',
        businessId: 'biz-1',
        name: 'Dueño',
        email: 'owner@biz.com',
        teamIds: [],
        preferences: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as never);
    mockFindBusiness.mockResolvedValue({ id: 'biz-1', ownerId: 'owner-1' } as never);
    mockFindUser.mockResolvedValueOnce(regularMember as never);
    mockRemoveMember.mockResolvedValueOnce(undefined);

    const req = new NextRequest('http://localhost/api/members/mem-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'mem-1' }) });

    expect(res.status).toBe(200);
    expect(mockRemoveMember).toHaveBeenCalledWith('mem-1', 'biz-1');
  });

  it('retorna 403 si el usuario no tiene permiso business.users.crud', async () => {
    mockRequireUser.mockResolvedValueOnce({
      uid: 'viewer-1',
      role: 'viewer',
      businessId: 'biz-1',
      email: 'viewer@biz.com',
      name: 'Viewer',
      data: { id: 'viewer-1', role: 'viewer', businessId: 'biz-1', name: 'Viewer', email: 'viewer@biz.com', teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    } as never);

    const req = new NextRequest('http://localhost/api/members/mem-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'mem-1' }) });

    expect(res.status).toBe(403);
    expect(mockRemoveMember).not.toHaveBeenCalled();
  });
});

// ─── PATCH /api/members/[id] — reactivación ──────────────────────────────────

describe('PATCH /api/members/[id] reactivar', () => {
  it('reactiva miembro usando businessId del admin', async () => {
    const inactiveMember = {
      ...regularMember,
      isActive: false,
      businessId: null, // fue removido, activo limpiado
      memberships: [
        { id: 'mb-3', userId: 'mem-1', businessId: 'biz-1', role: 'miembro', isActive: false, createdAt: new Date(), updatedAt: new Date() },
      ],
    };
    mockFindUser.mockResolvedValueOnce(inactiveMember as never);
    vi.mocked(teamService.reactivateMember).mockResolvedValueOnce(undefined);
    mockFindUser.mockResolvedValueOnce({ ...regularMember, isActive: true } as never);

    const req = new NextRequest('http://localhost/api/members/mem-1', {
      method: 'PATCH',
      body: JSON.stringify({ reactivate: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'mem-1' }) });

    expect(res.status).toBe(200);
    expect(vi.mocked(teamService.reactivateMember)).toHaveBeenCalledWith('mem-1', 'biz-1');
  });
});
