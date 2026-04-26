import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/locations/route';
import { locationService } from '@/services/location.service';
import { requireUser } from '@/lib/api/auth-helpers';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
}));

const mockRequireUser = vi.mocked(requireUser);

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/services/location.service', () => ({
  locationService: {
    getByBusiness: vi.fn(),
    getActiveLocations: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
  },
}));

const mockGetByBusiness = vi.mocked(locationService.getByBusiness);
const mockGetActive = vi.mocked(locationService.getActiveLocations);
const mockCreate = vi.mocked(locationService.create);

const allLocations = [
  { id: 'loc-1', name: 'Depósito', businessId: 'biz-1', status: 'active', type: 'department' },
  { id: 'loc-2', name: 'Archivo', businessId: 'biz-1', status: 'inactive', type: 'department' },
];
const activeLocations = [allLocations[0]];

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
});

// ─── GET /api/locations ───────────────────────────────────────────────────────

describe('GET /api/locations', () => {
  it('retorna 400 sin businessId', async () => {
    const req = new NextRequest('http://localhost/api/locations');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/businessId/i);
  });

  it('retorna todas las ubicaciones sin filtro de status', async () => {
    mockGetByBusiness.mockResolvedValueOnce(allLocations as never);
    const req = new NextRequest('http://localhost/api/locations?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(mockGetByBusiness).toHaveBeenCalledWith('biz-1');
  });

  it('con status=active filtra solo activas', async () => {
    mockGetActive.mockResolvedValueOnce(activeLocations as never);
    const req = new NextRequest('http://localhost/api/locations?businessId=biz-1&status=active');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(mockGetActive).toHaveBeenCalledWith('biz-1');
    expect(mockGetByBusiness).not.toHaveBeenCalled();
  });

  it('status distinto de "active" retorna todas', async () => {
    mockGetByBusiness.mockResolvedValueOnce(allLocations as never);
    const req = new NextRequest('http://localhost/api/locations?businessId=biz-1&status=inactive');
    await GET(req);
    expect(mockGetByBusiness).toHaveBeenCalled();
    expect(mockGetActive).not.toHaveBeenCalled();
  });
});

// ─── POST /api/locations ──────────────────────────────────────────────────────

describe('POST /api/locations', () => {
  it('retorna 400 sin businessId', async () => {
    const req = new NextRequest('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sector A' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 sin name', async () => {
    const req = new NextRequest('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('crea con type="department" y status="active" por defecto', async () => {
    const created = { id: 'loc-new', name: 'Nuevo', businessId: 'biz-1', type: 'department', status: 'active' };
    mockCreate.mockResolvedValueOnce(created as never);

    const req = new NextRequest('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1', name: 'Nuevo' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'department', status: 'active' })
    );
  });

  it('respeta el type enviado en el body', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'x' } as never);
    const req = new NextRequest('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1', name: 'Almacén', type: 'warehouse' }),
    });
    await POST(req);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warehouse' })
    );
  });

  it('retorna 201 con los datos de la ubicación creada', async () => {
    const loc = { id: 'loc-1', name: 'Test', businessId: 'biz-1' };
    mockCreate.mockResolvedValueOnce(loc as never);
    const req = new NextRequest('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1', name: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('loc-1');
  });
});
