import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/members/route';
import { teamService } from '@/services/team.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/services/team.service', () => ({
  teamService: {
    getMembersByBusiness: vi.fn(),
    inviteMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
  },
}));

const mockGetMembers = vi.mocked(teamService.getMembersByBusiness);
const mockInvite = vi.mocked(teamService.inviteMember);

const mockMembers = [
  { id: 'mem-1', name: 'Ana García', email: 'ana@biz.com', role: 'miembro', businessId: 'biz-1' },
  { id: 'mem-2', name: 'Bob Pérez', email: 'bob@biz.com', role: 'responsable', businessId: 'biz-1' },
];

beforeEach(() => {
  vi.clearAllMocks();
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

  it('retorna los miembros del negocio', async () => {
    mockGetMembers.mockResolvedValueOnce(mockMembers as never);
    const req = new NextRequest('http://localhost/api/members?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(mockGetMembers).toHaveBeenCalledWith('biz-1');
  });

  it('retorna array vacío si no hay miembros', async () => {
    mockGetMembers.mockResolvedValueOnce([] as never);
    const req = new NextRequest('http://localhost/api/members?businessId=biz-2');
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
    expect(mockInvite).toHaveBeenCalledWith(dto, 'biz-1');
  });
});
