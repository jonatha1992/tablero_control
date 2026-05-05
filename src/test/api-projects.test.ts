import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/projects/route';
import { projectService } from '@/services/project.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(() => null),
}));
vi.mock('@/lib/api/audit', () => ({ writeAuditLog: vi.fn() }));
vi.mock('@/services/project.service', () => ({
  projectService: {
    getByBusiness: vi.fn(),
    create: vi.fn(),
  },
}));

const mockRequireUser = vi.mocked(requireUser);
const mockGetProjects = vi.mocked(projectService.getByBusiness);
const mockCreate = vi.mocked(projectService.create);

const authedAdmin = {
  uid: 'user-1',
  role: 'admin',
  businessId: 'biz-1',
  email: 'admin@biz.com',
  name: 'Admin',
};

const mockProjects = [
  { id: 'p-1', name: 'Alpha', businessId: 'biz-1', status: 'active', _count: { tasks: 3 } },
  { id: 'p-2', name: 'Beta', businessId: 'biz-1', status: 'active', _count: { tasks: 1 } },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(authedAdmin as never);
});

// ─── GET /api/projects ────────────────────────────────────────────────────────

describe('GET /api/projects', () => {
  it('retorna proyectos del negocio', async () => {
    mockGetProjects.mockResolvedValueOnce(mockProjects as never);
    const req = new NextRequest('http://localhost/api/projects?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it('retorna 400 si no se pasa businessId', async () => {
    const req = new NextRequest('http://localhost/api/projects');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/businessId/i);
  });
});

// ─── POST /api/projects ───────────────────────────────────────────────────────

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.mocked(prisma.business.findUnique).mockResolvedValue({ plan: 'basic' } as never);
  });

  it('crea proyecto y retorna 201', async () => {
    const newProject = { id: 'p-new', name: 'Gamma', businessId: 'biz-1', _count: { tasks: 0 } };
    mockCreate.mockResolvedValueOnce(newProject as never);

    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Gamma', businessId: 'biz-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('p-new');
  });

  it('retorna 400 si name está vacío', async () => {
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: '  ' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/name/i);
  });

  it('retorna 429 si se supera límite de proyectos del plan', async () => {
    const limitError = new Error('projects_limit_exceeded');
    (limitError as any).limit = 3;
    (limitError as any).current = 3;
    mockCreate.mockRejectedValueOnce(limitError);

    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Nuevo' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('projects_limit_exceeded');
    expect(body.limit).toBe(3);
    expect(body.current).toBe(3);
  });

  it('pasa role del usuario al service (para bypass superadmin)', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'p-x', name: 'X', _count: { tasks: 0 } } as never);

    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'X' }),
    });
    await POST(req);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.any(Object),
      'admin',
      expect.any(String)
    );
  });
});
