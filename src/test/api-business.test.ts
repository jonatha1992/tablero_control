import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET as configGET, PATCH as configPATCH } from '@/app/api/business/config/route';
import { GET as invoicesGET } from '@/app/api/business/invoices/route';
import { GET as subscriptionGET } from '@/app/api/business/subscription/route';
import { requireUser } from '@/lib/api/auth-helpers';
import { businessRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';

vi.mock('@/lib/api/auth-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/auth-helpers')>();
  return { ...actual, requireUser: vi.fn() };
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

const mockRequireUser = vi.mocked(requireUser);
const mockFindById = vi.mocked(businessRepository.findById);
const mockUpdate = vi.mocked(businessRepository.update);
const mockWriteAuditLog = vi.mocked(writeAuditLog);

const adminUser = {
  uid: 'user-1',
  role: 'admin' as const,
  businessId: 'biz-1',
  email: 'admin@biz.com',
  name: 'Admin',
  data: { id: 'user-1', role: 'admin', businessId: 'biz-1', name: 'Admin', email: 'admin@biz.com', teamIds: [], preferences: {}, isActive: true, createdAt: new Date(), updatedAt: new Date() },
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
});

// ─── GET /api/business/config ────────────────────────────────────────────────

describe('GET /api/business/config', () => {
  it('retorna 401 si no está autenticado', async () => {
    mockRequireUser.mockResolvedValueOnce(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as never);
    const req = new NextRequest('http://localhost/api/business/config');
    const res = await configGET(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 si no hay businessId', async () => {
    mockRequireUser.mockResolvedValueOnce({ ...adminUser, businessId: undefined } as never);
    const req = new NextRequest('http://localhost/api/business/config');
    const res = await configGET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 404 si el negocio no existe', async () => {
    mockFindById.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/business/config');
    const res = await configGET(req);
    expect(res.status).toBe(404);
  });

  it('retorna 200 con los datos del negocio', async () => {
    mockFindById.mockResolvedValueOnce(mockBusiness as never);
    const req = new NextRequest('http://localhost/api/business/config');
    const res = await configGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('biz-1');
    expect(body.name).toBe('Mi Negocio');
  });
});

// ─── PATCH /api/business/config ──────────────────────────────────────────────

describe('PATCH /api/business/config', () => {
  it('retorna 401 si no está autenticado', async () => {
    mockRequireUser.mockResolvedValueOnce(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as never);
    const req = new NextRequest('http://localhost/api/business/config', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nuevo Nombre' }),
    });
    const res = await configPATCH(req);
    expect(res.status).toBe(401);
  });

  it('retorna 403 si el usuario es miembro', async () => {
    mockRequireUser.mockResolvedValueOnce({ ...adminUser, role: 'miembro' } as never);
    const req = new NextRequest('http://localhost/api/business/config', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nuevo Nombre' }),
    });
    const res = await configPATCH(req);
    expect(res.status).toBe(403);
  });

  it('retorna 400 si no hay businessId', async () => {
    mockRequireUser.mockResolvedValueOnce({ ...adminUser, businessId: undefined } as never);
    const req = new NextRequest('http://localhost/api/business/config', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nuevo Nombre' }),
    });
    const res = await configPATCH(req);
    expect(res.status).toBe(400);
  });

  it('actualiza el negocio y retorna success', async () => {
    mockFindById.mockResolvedValueOnce(mockBusiness as never);
    mockUpdate.mockResolvedValueOnce(undefined as never);
    const req = new NextRequest('http://localhost/api/business/config', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nuevo Nombre' }),
    });
    const res = await configPATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith('biz-1', expect.objectContaining({ name: 'Nuevo Nombre' }));
  });

  it('escribe audit log después de actualizar', async () => {
    mockFindById.mockResolvedValueOnce(mockBusiness as never);
    mockUpdate.mockResolvedValueOnce(undefined as never);
    const req = new NextRequest('http://localhost/api/business/config', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nuevo Nombre' }),
    });
    await configPATCH(req);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'business.update',
      targetType: 'BUSINESS',
      targetId: 'biz-1',
    }));
  });
});

// ─── GET /api/business/invoices ───────────────────────────────────────────────

describe('GET /api/business/invoices', () => {
  const mockInvoices = [
    { id: 'inv-1', businessId: 'biz-1', amount: 3999, status: 'paid', createdAt: new Date() },
    { id: 'inv-2', businessId: 'biz-1', amount: 3999, status: 'pending', createdAt: new Date() },
  ];

  it('retorna 401 si no está autenticado', async () => {
    mockRequireUser.mockResolvedValueOnce(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as never);
    const req = new NextRequest('http://localhost/api/business/invoices');
    const res = await invoicesGET(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 si no hay businessId', async () => {
    mockRequireUser.mockResolvedValueOnce({ ...adminUser, businessId: undefined } as never);
    const req = new NextRequest('http://localhost/api/business/invoices');
    const res = await invoicesGET(req);
    expect(res.status).toBe(400);
  });

  it('retorna la lista de facturas', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce(mockInvoices as never);
    const req = new NextRequest('http://localhost/api/business/invoices');
    const res = await invoicesGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe('inv-1');
  });

  it('filtra por subscriptionId si se provee', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([mockInvoices[0]] as never);
    const req = new NextRequest('http://localhost/api/business/invoices?subscriptionId=sub-1');
    const res = await invoicesGET(req);
    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.invoice.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ subscriptionId: 'sub-1' }) })
    );
  });
});

// ─── GET /api/business/subscription ──────────────────────────────────────────

describe('GET /api/business/subscription', () => {
  const mockSubscription = {
    id: 'sub-1',
    businessId: 'biz-1',
    plan: 'pro',
    status: 'active',
    amount: 9999,
    frequency: 'monthly',
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('retorna 401 si no está autenticado', async () => {
    mockRequireUser.mockResolvedValueOnce(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as never);
    const req = new NextRequest('http://localhost/api/business/subscription');
    const res = await subscriptionGET(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 si no hay businessId', async () => {
    mockRequireUser.mockResolvedValueOnce({ ...adminUser, businessId: undefined } as never);
    const req = new NextRequest('http://localhost/api/business/subscription');
    const res = await subscriptionGET(req);
    expect(res.status).toBe(400);
  });

  it('retorna la suscripción activa', async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValueOnce(mockSubscription as never);
    const req = new NextRequest('http://localhost/api/business/subscription');
    const res = await subscriptionGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('sub-1');
    expect(body.plan).toBe('pro');
  });

  it('retorna null si no hay suscripción', async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/business/subscription');
    const res = await subscriptionGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });
});
