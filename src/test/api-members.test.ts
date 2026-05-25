import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/members/route';
import { teamService } from '@/services/team.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { businessRepository } from '@/repositories';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn().mockReturnValue(null),
  requireActiveSubscription: vi.fn().mockReturnValue(null),
}));

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: vi.fn(() => ({
    createUser: vi.fn(() => Promise.resolve({ uid: 'firebase-uid-123' })),
    getUserByEmail: vi.fn(() => Promise.resolve({ uid: 'firebase-uid-123' })),
    generatePasswordResetLink: vi.fn(() => Promise.resolve('https://example.com/reset')),
  })),
}));

vi.mock('@/services/mail.service', () => ({
  MailService: {
    sendInviteEmail: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

vi.mock('@/services/team.service', () => ({
  teamService: {
    getMembersByBusiness: vi.fn(),
    inviteMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
  },
}));

vi.mock('@/repositories', () => ({
  businessRepository: { findById: vi.fn() },
  userRepository: { findById: vi.fn(), addMembership: vi.fn() },
  teamRepository: {},
  locationRepository: {},
}));

const mockRequireUser = vi.mocked(requireUser);
const mockGetMembers = vi.mocked(teamService.getMembersByBusiness);
const mockInvite = vi.mocked(teamService.inviteMember);
const mockFindBusiness = vi.mocked(businessRepository.findById);

const mockMembers = [
  { id: 'mem-1', name: 'Ana García', email: 'ana@biz.com', role: 'miembro', businessId: 'biz-1' },
  { id: 'mem-2', name: 'Bob Pérez', email: 'bob@biz.com', role: 'responsable', businessId: 'biz-1' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue({
    uid: 'user-1',
    role: 'admin',
    businessId: 'biz-1',
    email: 'admin@biz.com',
    name: 'Admin',
    data: { id: 'user-1', role: 'admin', businessId: 'biz-1', name: 'Admin', email: 'admin@biz.com', teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  } as never);
  mockFindBusiness.mockResolvedValue({ id: 'biz-1', ownerId: 'owner-1' } as never);
});

// ─── GET /api/members ────────────────────────────────────────────────────────

describe('GET /api/members', () => {
  it('retorna 400 sin businessId', async () => {
    const req = new NextRequest('http://localhost/api/members');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/businessId/i);
  });

  it('retorna los miembros con isOwner calculado', async () => {
    mockGetMembers.mockResolvedValueOnce(mockMembers as never);
    const req = new NextRequest('http://localhost/api/members?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].isOwner).toBe(false);
    expect(body[1].isOwner).toBe(false);
  });

  it('marca isOwner=true para el propietario del negocio', async () => {
    const membersWithOwner = [
      ...mockMembers,
      { id: 'owner-1', name: 'Dueño', email: 'owner@biz.com', role: 'admin', businessId: 'biz-1' },
    ];
    mockGetMembers.mockResolvedValueOnce(membersWithOwner as never);
    const req = new NextRequest('http://localhost/api/members?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const owner = body.find((m: { id: string }) => m.id === 'owner-1');
    expect(owner.isOwner).toBe(true);
  });

  it('retorna array vacío si no hay miembros', async () => {
    mockGetMembers.mockResolvedValueOnce([] as never);
    const req = new NextRequest('http://localhost/api/members?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

// ─── POST /api/members ───────────────────────────────────────────────────────

describe('POST /api/members', () => {
  it('invita miembro y retorna 201', async () => {
    const newMember = { id: 'mem-new', email: 'new@biz.com', role: 'miembro' };
    mockInvite.mockResolvedValueOnce(newMember as never);

    const req = new NextRequest('http://localhost/api/members', {
      method: 'POST',
      body: JSON.stringify({
        dto: { email: 'new@biz.com', role: 'miembro', name: 'Nuevo Usuario' },
        businessId: 'biz-1',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('mem-new');
  });

  it('llama teamService.inviteMember con dto y businessId', async () => {
    mockInvite.mockResolvedValueOnce({ id: 'x' } as never);
    const dto = { email: 'x@y.com', role: 'viewer', name: 'X' };

    const req = new NextRequest('http://localhost/api/members', {
      method: 'POST',
      body: JSON.stringify({ dto, businessId: 'biz-1' }),
    });
    await POST(req);
    expect(mockInvite).toHaveBeenCalledWith(dto, 'biz-1', 'firebase-uid-123');
  });
});

