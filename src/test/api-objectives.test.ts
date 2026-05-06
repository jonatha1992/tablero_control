import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/objectives/route';
import { objectiveService } from '@/services/objective.service';
import { requireUser } from '@/lib/api/auth-helpers';

vi.mock('@/lib/api/auth-helpers', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/api/audit', () => ({ writeAuditLog: vi.fn() }));
vi.mock('@/services/objective.service', () => ({
  objectiveService: {
    getObjectivesByBusiness: vi.fn(),
    createObjective: vi.fn(),
  },
}));

const mockRequireUser = vi.mocked(requireUser);
const mockGetObjectives = vi.mocked(objectiveService.getObjectivesByBusiness);
const mockCreate = vi.mocked(objectiveService.createObjective);

const authedUser = {
  uid: 'user-1',
  role: 'admin',
  businessId: 'biz-1',
  email: 'admin@biz.com',
  name: 'Admin',
};

const mockObjectives = [
  { id: 'o-1', name: 'Lanzar v2', status: 'active', businessId: 'biz-1', progress: 40 },
  { id: 'o-2', name: 'Reducir bugs', status: 'active', businessId: 'biz-1', progress: 75 },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(authedUser as never);
});

// ─── GET /api/objectives ──────────────────────────────────────────────────────

describe('GET /api/objectives', () => {
  it('retorna objetivos del business del usuario', async () => {
    mockGetObjectives.mockResolvedValueOnce(mockObjectives as never);
    const req = new NextRequest('http://localhost/api/objectives');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(mockGetObjectives).toHaveBeenCalledWith('biz-1');
  });

  it('usa businessId del query param si se proporciona', async () => {
    mockGetObjectives.mockResolvedValueOnce([mockObjectives[0]] as never);
    const req = new NextRequest('http://localhost/api/objectives?businessId=biz-otro');
    await GET(req);
    expect(mockGetObjectives).toHaveBeenCalledWith('biz-otro');
  });

  it('retorna 400 si no hay businessId disponible', async () => {
    mockRequireUser.mockResolvedValueOnce({ ...authedUser, businessId: undefined } as never);
    const req = new NextRequest('http://localhost/api/objectives');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna array vacío si no hay objetivos', async () => {
    mockGetObjectives.mockResolvedValueOnce([] as never);
    const req = new NextRequest('http://localhost/api/objectives');
    const res = await GET(req);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

// ─── POST /api/objectives ─────────────────────────────────────────────────────

describe('POST /api/objectives', () => {
  it('crea objetivo y retorna 201', async () => {
    const newObj = { id: 'o-new', name: 'Nuevo objetivo', status: 'active', businessId: 'biz-1', progress: 0 };
    mockCreate.mockResolvedValueOnce(newObj as never);

    const req = new NextRequest('http://localhost/api/objectives', {
      method: 'POST',
      body: JSON.stringify({ name: 'Nuevo objetivo' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('o-new');
  });

  it('pasa businessId del usuario al service', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'o-x', name: 'X', businessId: 'biz-1', progress: 0 } as never);

    const req = new NextRequest('http://localhost/api/objectives', {
      method: 'POST',
      body: JSON.stringify({ name: 'X' }),
    });
    await POST(req);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ businessId: 'biz-1' }));
  });

  it('retorna 500 si nombre vacío lanza error de servicio', async () => {
    mockCreate.mockRejectedValueOnce(new Error('El nombre del objetivo es requerido'));
    const req = new NextRequest('http://localhost/api/objectives', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
