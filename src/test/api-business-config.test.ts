import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/auth-helpers')>();
  return { ...actual, requireUser: vi.fn(), requireRole: vi.fn() };
});

vi.mock('@/repositories', () => ({
  businessRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn(),
}));

vi.mock('@/lib/api/route-handler', () => ({
  handle: (fn: (req: NextRequest) => Promise<NextResponse>) => fn,
}));

import { GET, PATCH } from '@/app/api/business/config/route';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { businessRepository } from '@/repositories';
import { writeAuditLog } from '@/lib/api/audit';

const mockRequireUser = vi.mocked(requireUser);
const mockRequireRole = vi.mocked(requireRole);
const mockFindById = vi.mocked(businessRepository.findById);
const mockUpdate = vi.mocked(businessRepository.update);
const mockWriteAuditLog = vi.mocked(writeAuditLog);

const adminUser = {
  uid: 'user-1',
  role: 'admin' as const,
  businessId: 'biz-1',
  email: 'admin@biz.com',
  name: 'Admin',
  data: {
    id: 'user-1',
    role: 'admin',
    businessId: 'biz-1',
    name: 'Admin',
    email: 'admin@biz.com',
    teamIds: [],
    preferences: {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

const mockBusiness = {
  id: 'biz-1',
  name: 'Mi Negocio',
  plan: 'free',
  status: 'active',
  settings: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(adminUser as never);
  mockRequireRole.mockReturnValue(null);
});

// ─── GET /api/business/config ────────────────────────────────────────────────

describe('GET /api/business/config', () => {
  it('retorna 401 cuando no está autenticado', async () => {
    mockRequireUser.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as never,
    );
    const req = new NextRequest('http://localhost/api/business/config');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 cuando el usuario no tiene businessId', async () => {
    mockRequireUser.mockResolvedValueOnce({ ...adminUser, businessId: undefined } as never);
    const req = new NextRequest('http://localhost/api/business/config');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('business_id_required');
  });

  it('retorna 404 cuando el negocio no existe', async () => {
    mockFindById.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/business/config');
    const res = await GET(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('business_not_found');
  });

  it('retorna 200 con los datos del negocio en caso de éxito', async () => {
    mockFindById.mockResolvedValueOnce(mockBusiness as never);
    const req = new NextRequest('http://localhost/api/business/config');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('biz-1');
    expect(body.name).toBe('Mi Negocio');
  });
});

// ─── PATCH /api/business/config ──────────────────────────────────────────────

describe('PATCH /api/business/config', () => {
  it('retorna 403 cuando el usuario no es admin', async () => {
    mockRequireRole.mockReturnValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    );
    const req = new NextRequest('http://localhost/api/business/config', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nuevo Nombre' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
  });

  it('retorna 400 cuando el usuario no tiene businessId', async () => {
    mockRequireUser.mockResolvedValueOnce({ ...adminUser, businessId: undefined } as never);
    const req = new NextRequest('http://localhost/api/business/config', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nuevo Nombre' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('business_id_required');
  });

  it('actualiza el negocio y escribe audit log en caso de éxito', async () => {
    mockUpdate.mockResolvedValueOnce(undefined as never);
    mockWriteAuditLog.mockResolvedValueOnce(undefined as never);
    const req = new NextRequest('http://localhost/api/business/config', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nuevo Nombre', settings: { maxUsers: 10 } }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ name: 'Nuevo Nombre', settings: { maxUsers: 10 } }),
    );
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        actorRole: 'admin',
        businessId: 'biz-1',
        action: 'business.update',
        targetType: 'BUSINESS',
        targetId: 'biz-1',
      }),
    );
  });

  it('retorna 500 cuando ocurre un error en la actualización', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB connection lost'));
    const req = new NextRequest('http://localhost/api/business/config', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nuevo Nombre' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('update_failed');
    expect(body.details).toBe('DB connection lost');
  });
});
