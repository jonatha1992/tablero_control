import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cycles/route';
import { cycleService } from '@/services/cycle.service';
import { requireUser } from '@/lib/api/auth-helpers';

vi.mock('@/lib/api/auth-helpers', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/api/audit', () => ({ writeAuditLog: vi.fn() }));
vi.mock('@/services/cycle.service', () => ({
  cycleService: {
    getCyclesByBusiness: vi.fn(),
    createCycle: vi.fn(),
  },
}));

const mockRequireUser = vi.mocked(requireUser);
const mockGetCycles = vi.mocked(cycleService.getCyclesByBusiness);
const mockCreate = vi.mocked(cycleService.createCycle);

const authedUser = {
  uid: 'user-1',
  role: 'admin',
  businessId: 'biz-1',
  email: 'admin@biz.com',
  name: 'Admin',
  data: { id: 'user-1', role: 'admin', businessId: 'biz-1' },
};

const mockCycles = [
  { id: 'c-1', name: 'Sprint 1', status: 'planning', businessId: 'biz-1' },
  { id: 'c-2', name: 'Sprint 2', status: 'active', businessId: 'biz-1' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(authedUser as never);
});

// ─── GET /api/cycles ──────────────────────────────────────────────────────────

describe('GET /api/cycles', () => {
  it('retorna ciclos usando businessId del usuario autenticado', async () => {
    mockGetCycles.mockResolvedValueOnce(mockCycles as never);
    const req = new NextRequest('http://localhost/api/cycles');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(mockGetCycles).toHaveBeenCalledWith('biz-1');
  });

  it('usa businessId del query param si se proporciona', async () => {
    mockGetCycles.mockResolvedValueOnce([mockCycles[0]] as never);
    const req = new NextRequest('http://localhost/api/cycles?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockGetCycles).toHaveBeenCalledWith('biz-1');
  });

  it('retorna 400 si usuario no tiene businessId y no se pasa query param', async () => {
    mockRequireUser.mockResolvedValueOnce({ ...authedUser, businessId: undefined } as never);
    const req = new NextRequest('http://localhost/api/cycles');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/businessId/i);
  });

  it('retorna array vacío si no hay ciclos', async () => {
    mockGetCycles.mockResolvedValueOnce([] as never);
    const req = new NextRequest('http://localhost/api/cycles');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

// ─── POST /api/cycles ─────────────────────────────────────────────────────────

describe('POST /api/cycles', () => {
  it('crea ciclo y retorna 201', async () => {
    const newCycle = { id: 'c-new', name: 'Sprint 3', status: 'planning', businessId: 'biz-1' };
    mockCreate.mockResolvedValueOnce(newCycle as never);

    const req = new NextRequest('http://localhost/api/cycles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sprint 3' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('c-new');
  });

  it('pasa businessId del usuario autenticado al service', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'c-x', name: 'X', businessId: 'biz-1' } as never);

    const req = new NextRequest('http://localhost/api/cycles', {
      method: 'POST',
      body: JSON.stringify({ name: 'X' }),
    });
    await POST(req);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ businessId: 'biz-1' }));
  });

  it('retorna 500 si el service lanza error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB error'));
    const req = new NextRequest('http://localhost/api/cycles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sprint' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('retorna 403 si viewer intenta crear ciclo', async () => {
    mockRequireUser.mockResolvedValueOnce({
      ...authedUser,
      role: 'viewer',
      data: { id: 'user-1', role: 'viewer', businessId: 'biz-1' },
    } as never);
    const req = new NextRequest('http://localhost/api/cycles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sprint' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('retorna 403 si miembro intenta crear ciclo', async () => {
    mockRequireUser.mockResolvedValueOnce({
      ...authedUser,
      role: 'miembro',
      data: { id: 'user-1', role: 'miembro', businessId: 'biz-1' },
    } as never);
    const req = new NextRequest('http://localhost/api/cycles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sprint' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
