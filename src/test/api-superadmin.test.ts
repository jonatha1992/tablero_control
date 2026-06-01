import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET as metricsGET } from '@/app/api/superadmin/metrics/route';
import { GET as bizGET, PATCH as bizPATCH } from '@/app/api/superadmin/businesses/route';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import * as auditLib from '@/lib/api/audit';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase/admin', () => ({
  verifyToken: vi.fn(),
  getAdminApp: vi.fn(),
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn(),
}));

const mockRequireUser = vi.mocked(requireUser);
const mockRequireRole = vi.mocked(requireRole);
const mockWriteAuditLog = vi.mocked(auditLib.writeAuditLog);
const mockTransaction = vi.mocked(prisma.$transaction as ReturnType<typeof vi.fn>);
const mockBusinessFindMany = vi.mocked(prisma.business.findMany as ReturnType<typeof vi.fn>);
const mockBusinessUpdate = vi.mocked(prisma.business.update as ReturnType<typeof vi.fn>);

const superadminUser = {
  uid: 'sa-1',
  role: 'superadmin' as const,
  businessId: undefined,
  email: 'sa@tecnofusion.com',
  data: {} as never,
};

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, { headers: { Authorization: 'Bearer sa-token' }, ...options } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(superadminUser);
  mockRequireRole.mockReturnValue(null); // permitido
});

// ─── GET /api/superadmin/metrics ──────────────────────────────────────────────

describe('GET /api/superadmin/metrics', () => {
  it('retorna 401 sin token (requireUser devuelve 401)', async () => {
    mockRequireUser.mockResolvedValueOnce(
      NextResponse.json({ error: 'missing_token' }, { status: 401 })
    );
    const req = makeRequest('http://localhost/api/superadmin/metrics', { headers: {} });
    const res = await metricsGET(req);
    expect(res.status).toBe(401);
  });

  it('retorna 403 si no es superadmin', async () => {
    mockRequireUser.mockResolvedValueOnce({ uid: 'adm-1', role: 'admin', data: {} } as never);
    mockRequireRole.mockReturnValueOnce(
      NextResponse.json({ error: 'forbidden' }, { status: 403 })
    );
    const req = makeRequest('http://localhost/api/superadmin/metrics');
    const res = await metricsGET(req);
    expect(res.status).toBe(403);
  });

  it('retorna estructura correcta con MRR y planBreakdown', async () => {
    // Mockear $transaction para retornar los 13 valores en orden
    mockTransaction.mockResolvedValueOnce([
      5,   // totalBusinesses
      4,   // activeBusinesses
      1,   // suspendedBusinesses
      0,   // trialBusinesses
      20,  // totalUsers
      100, // totalTasks
      [{ amount: 9999 }, { amount: 3999 }], // activeSubscriptions
      2,   // freePlan
      1,   // basicPlan
      1,   // proPlan
      0,   // enterprisePlan
      [],  // recentUsers
      [],  // recentBusinesses
    ]);

    const req = makeRequest('http://localhost/api/superadmin/metrics');
    const res = await metricsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.businesses.total).toBe(5);
    expect(body.businesses.active).toBe(4);
    expect(body.subscriptions.mrr).toBe(13998); // 9999 + 3999
    expect(body.planBreakdown).toMatchObject({ free: 2, basic: 1, pro: 1, enterprise: 0 });
    expect(body.users.total).toBe(20);
    expect(body.tasks.total).toBe(100);
  });
});

// ─── GET /api/superadmin/businesses ──────────────────────────────────────────

describe('GET /api/superadmin/businesses', () => {
  it('retorna lista paginada (máx 100)', async () => {
    const bizList = Array.from({ length: 5 }, (_, i) => ({
      id: `biz-${i}`,
      name: `Negocio ${i}`,
      plan: 'free',
      status: 'active',
      createdAt: new Date(),
    }));
    mockBusinessFindMany.mockResolvedValueOnce(bizList);

    const req = makeRequest('http://localhost/api/superadmin/businesses');
    const res = await bizGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.businesses).toHaveLength(5);
  });

  it('retorna 401 sin token', async () => {
    mockRequireUser.mockResolvedValueOnce(
      NextResponse.json({ error: 'missing_token' }, { status: 401 })
    );
    const req = new NextRequest('http://localhost/api/superadmin/businesses');
    const res = await bizGET(req);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/superadmin/businesses — suspend ────────────────────────────────

describe('PATCH /api/superadmin/businesses — suspend', () => {
  it('actualiza status a "suspended" y escribe audit log "business.suspend"', async () => {
    mockBusinessUpdate.mockResolvedValueOnce({ id: 'biz-1', status: 'suspended' } as never);
    mockWriteAuditLog.mockResolvedValueOnce(undefined);

    const req = new NextRequest('http://localhost/api/superadmin/businesses', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer sa-token' },
      body: JSON.stringify({ businessId: 'biz-1', action: 'suspend' }),
    });
    const res = await bizPATCH(req);
    expect(res.status).toBe(200);

    expect(mockBusinessUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'biz-1' },
        data: expect.objectContaining({ status: 'suspended' }),
      })
    );
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'business.suspend', targetId: 'biz-1' })
    );
  });

  it('reactivate: limpia suspendedAt y escribe audit "business.reactivate"', async () => {
    mockBusinessUpdate.mockResolvedValueOnce({ id: 'biz-1', status: 'active' } as never);
    mockWriteAuditLog.mockResolvedValueOnce(undefined);

    const req = new NextRequest('http://localhost/api/superadmin/businesses', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer sa-token' },
      body: JSON.stringify({ businessId: 'biz-1', action: 'reactivate' }),
    });
    const res = await bizPATCH(req);
    expect(res.status).toBe(200);
    expect(mockBusinessUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'active', suspendedAt: null }),
      })
    );
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'business.reactivate' })
    );
  });

  it('retorna 400 si falta businessId o action', async () => {
    const req = new NextRequest('http://localhost/api/superadmin/businesses', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer sa-token' },
      body: JSON.stringify({ action: 'suspend' }), // falta businessId
    });
    const res = await bizPATCH(req);
    expect(res.status).toBe(400);
  });
});
