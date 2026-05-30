import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks (before imports that use them) ────────────────────────────────────

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(() => null),
}));

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn(),
}));

vi.mock('@/lib/api/route-handler', () => ({
  handle: (fn: (req: NextRequest, ctx?: unknown) => Promise<NextResponse>) => fn,
}));

vi.mock('@/lib/firebase/admin', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/mercadopago/plan-config', () => ({
  getEffectivePlanConfig: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(),
}));

vi.mock('@/lib/permissions/tenant-guard', () => ({
  assertSameTenant: vi.fn(),
  assertResourceBelongsToBusiness: vi.fn(),
}));

// Extend global prisma mock (from setup.ts) with models not covered there.
// Note: vi.mock in a test file re-runs the factory independently from setup.ts,
// so `importOriginal` returns the real module, not setup's mocked version.
// We must explicitly declare every method we need as vi.fn().
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    businessInvite: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userBusiness: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    business: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

// ─── Deferred imports (after vi.mock calls) ───────────────────────────────────

import { GET as listGET, POST as createPOST } from '@/app/api/invites/route';
import { GET as detailGET, DELETE as revokeDelete } from '@/app/api/invites/[token]/route';
import { POST as acceptPOST } from '@/app/api/invites/[token]/accept/route';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { verifyToken } from '@/lib/firebase/admin';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';
import { prisma } from '@/lib/prisma';

// ─── Typed mocks ─────────────────────────────────────────────────────────────

const mockRequireUser = vi.mocked(requireUser);
const mockRequireRole = vi.mocked(requireRole);
const mockWriteAuditLog = vi.mocked(writeAuditLog);
const mockVerifyToken = vi.mocked(verifyToken);
const mockGetEffectivePlanConfig = vi.mocked(getEffectivePlanConfig);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const authedUser = {
  uid: 'user-1',
  role: 'admin',
  businessId: 'biz-1',
  email: 'a@b.com',
  name: 'Admin',
  data: {
    id: 'user-1',
    role: 'admin',
    businessId: 'biz-1',
    memberships: [{ businessId: 'biz-1', role: 'admin', isActive: true }],
  },
};

const mockInvite = {
  id: 'inv-1',
  businessId: 'biz-1',
  role: 'miembro',
  locationIds: [],
  maxUses: 0,
  usedCount: 0,
  expiresAt: null,
  createdBy: 'user-1',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockInviteWithBusiness = {
  ...mockInvite,
  business: { name: 'Acme Corp' },
};

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(authedUser as never);
  mockRequireRole.mockReturnValue(null);
  mockWriteAuditLog.mockResolvedValue(undefined as never);
});

// ─── GET /api/invites ─────────────────────────────────────────────────────────

describe('GET /api/invites', () => {
  it('retorna 400 si no se pasa businessId', async () => {
    const req = new NextRequest('http://localhost/api/invites');
    const res = await listGET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/businessId/i);
  });

  it('retorna 401 si requireUser devuelve NextResponse', async () => {
    mockRequireUser.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as never
    );
    const req = new NextRequest('http://localhost/api/invites?businessId=biz-1');
    const res = await listGET(req);
    expect(res.status).toBe(401);
  });

  it('retorna 403 si requireRole devuelve respuesta de acceso denegado', async () => {
    mockRequireRole.mockReturnValueOnce(
      NextResponse.json({ error: 'forbidden' }, { status: 403 }) as never
    );
    const req = new NextRequest('http://localhost/api/invites?businessId=biz-1');
    const res = await listGET(req);
    expect(res.status).toBe(403);
  });

  it('retorna lista de invitaciones activas', async () => {
    vi.mocked(prisma.businessInvite.findMany).mockResolvedValueOnce(
      [mockInvite] as never
    );

    const req = new NextRequest('http://localhost/api/invites?businessId=biz-1');
    const res = await listGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('inv-1');
  });

  it('filtra por businessId al consultar prisma', async () => {
    vi.mocked(prisma.businessInvite.findMany).mockResolvedValueOnce([] as never);

    const req = new NextRequest('http://localhost/api/invites?businessId=biz-1');
    await listGET(req);
    expect(prisma.businessInvite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: 'biz-1', isActive: true }),
      })
    );
  });

  it('retorna array vacío si no hay invitaciones', async () => {
    vi.mocked(prisma.businessInvite.findMany).mockResolvedValueOnce([] as never);
    const req = new NextRequest('http://localhost/api/invites?businessId=biz-1');
    const res = await listGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

// ─── POST /api/invites ────────────────────────────────────────────────────────

describe('POST /api/invites', () => {
  it('retorna 400 si no se pasa businessId', async () => {
    const req = new NextRequest('http://localhost/api/invites', {
      method: 'POST',
      body: JSON.stringify({ role: 'miembro' }),
    });
    const res = await createPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/businessId/i);
  });

  it('retorna 400 si el body es JSON inválido', async () => {
    const req = new NextRequest('http://localhost/api/invites', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await createPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_body');
  });

  it('retorna 401 si requireUser devuelve NextResponse', async () => {
    mockRequireUser.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as never
    );
    const req = new NextRequest('http://localhost/api/invites', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1' }),
    });
    const res = await createPOST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 403 si requireRole devuelve respuesta de acceso denegado', async () => {
    mockRequireRole.mockReturnValueOnce(
      NextResponse.json({ error: 'forbidden' }, { status: 403 }) as never
    );
    const req = new NextRequest('http://localhost/api/invites', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1' }),
    });
    const res = await createPOST(req);
    expect(res.status).toBe(403);
  });

  it('crea invitación y retorna 201 con link', async () => {
    vi.mocked(prisma.businessInvite.create).mockResolvedValueOnce(mockInvite as never);

    const req = new NextRequest('http://localhost/api/invites', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1', role: 'miembro', expiresInDays: 7 }),
    });
    const res = await createPOST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('inv-1');
    expect(body.link).toContain('/i/inv-1');
  });

  it('usa role=miembro por defecto si no se especifica un role válido', async () => {
    vi.mocked(prisma.businessInvite.create).mockResolvedValueOnce(mockInvite as never);

    const req = new NextRequest('http://localhost/api/invites', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1', role: 'invalid_role' }),
    });
    await createPOST(req);
    expect(prisma.businessInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'miembro' }),
      })
    );
  });

  it('acepta role=responsable cuando se proporciona', async () => {
    const invite = { ...mockInvite, role: 'responsable' };
    vi.mocked(prisma.businessInvite.create).mockResolvedValueOnce(invite as never);

    const req = new NextRequest('http://localhost/api/invites', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1', role: 'responsable' }),
    });
    await createPOST(req);
    expect(prisma.businessInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'responsable' }),
      })
    );
  });

  it('guarda expiresAt=null cuando expiresInDays=0', async () => {
    vi.mocked(prisma.businessInvite.create).mockResolvedValueOnce(mockInvite as never);

    const req = new NextRequest('http://localhost/api/invites', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1', expiresInDays: 0 }),
    });
    await createPOST(req);
    expect(prisma.businessInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ expiresAt: null }),
      })
    );
  });

  it('escribe audit log al crear invitación', async () => {
    vi.mocked(prisma.businessInvite.create).mockResolvedValueOnce(mockInvite as never);

    const req = new NextRequest('http://localhost/api/invites', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1' }),
    });
    await createPOST(req);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'invite_link.create' })
    );
  });
});

// ─── GET /api/invites/[token] ─────────────────────────────────────────────────

describe('GET /api/invites/[token]', () => {
  const makeParams = (token: string) =>
    ({ params: Promise.resolve({ token }) }) as { params: Promise<{ token: string }> };

  it('retorna valid=false con reason=revoked si invite no existe', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce(null as never);

    const req = new NextRequest('http://localhost/api/invites/bad-token');
    const res = await detailGET(req, makeParams('bad-token'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.reason).toBe('revoked');
  });

  it('retorna valid=false con reason=revoked si invite tiene isActive=false', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      isActive: false,
    } as never);

    const req = new NextRequest('http://localhost/api/invites/inv-1');
    const res = await detailGET(req, makeParams('inv-1'));
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.reason).toBe('revoked');
  });

  it('retorna valid=false con reason=expired si la invitación expiró', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      expiresAt: new Date('2000-01-01'),
    } as never);

    const req = new NextRequest('http://localhost/api/invites/inv-1');
    const res = await detailGET(req, makeParams('inv-1'));
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.reason).toBe('expired');
  });

  it('retorna valid=false con reason=max_uses si se alcanzó el límite de usos', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      maxUses: 5,
      usedCount: 5,
    } as never);

    const req = new NextRequest('http://localhost/api/invites/inv-1');
    const res = await detailGET(req, makeParams('inv-1'));
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.reason).toBe('max_uses');
  });

  it('retorna detalles de la invitación válida', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
    } as never);

    const req = new NextRequest('http://localhost/api/invites/inv-1');
    const res = await detailGET(req, makeParams('inv-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.businessName).toBe('Acme Corp');
    expect(body.role).toBe('miembro');
  });

  it('calcula usesLeft correctamente cuando maxUses > 0', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      maxUses: 10,
      usedCount: 3,
    } as never);

    const req = new NextRequest('http://localhost/api/invites/inv-1');
    const res = await detailGET(req, makeParams('inv-1'));
    const body = await res.json();
    expect(body.usesLeft).toBe(7);
  });

  it('retorna usesLeft=null cuando maxUses=0 (ilimitado)', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      maxUses: 0,
    } as never);

    const req = new NextRequest('http://localhost/api/invites/inv-1');
    const res = await detailGET(req, makeParams('inv-1'));
    const body = await res.json();
    expect(body.usesLeft).toBeNull();
  });
});

// ─── DELETE /api/invites/[token] ──────────────────────────────────────────────

describe('DELETE /api/invites/[token]', () => {
  const makeParams = (token: string) =>
    ({ params: Promise.resolve({ token }) }) as { params: Promise<{ token: string }> };

  it('retorna 401 si requireUser devuelve NextResponse', async () => {
    mockRequireUser.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as never
    );
    const req = new NextRequest('http://localhost/api/invites/inv-1', { method: 'DELETE' });
    const res = await revokeDelete(req, makeParams('inv-1'));
    expect(res.status).toBe(401);
  });

  it('retorna 404 si el invite no existe', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce(null as never);

    const req = new NextRequest('http://localhost/api/invites/bad-token', { method: 'DELETE' });
    const res = await revokeDelete(req, makeParams('bad-token'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('not_found');
  });

  it('revoca la invitación (isActive=false) y retorna success', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce(mockInvite as never);
    vi.mocked(prisma.businessInvite.update).mockResolvedValueOnce({
      ...mockInvite,
      isActive: false,
    } as never);

    const req = new NextRequest('http://localhost/api/invites/inv-1', { method: 'DELETE' });
    const res = await revokeDelete(req, makeParams('inv-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.businessInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: { isActive: false },
      })
    );
  });

  it('escribe audit log al revocar invitación', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce(mockInvite as never);
    vi.mocked(prisma.businessInvite.update).mockResolvedValueOnce({
      ...mockInvite,
      isActive: false,
    } as never);

    const req = new NextRequest('http://localhost/api/invites/inv-1', { method: 'DELETE' });
    await revokeDelete(req, makeParams('inv-1'));
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'invite_link.revoke' })
    );
  });
});

// ─── POST /api/invites/[token]/accept ─────────────────────────────────────────

describe('POST /api/invites/[token]/accept', () => {
  const makeParams = (token: string) =>
    ({ params: Promise.resolve({ token }) }) as { params: Promise<{ token: string }> };

  const makeAuthedRequest = (token = 'inv-1') =>
    new NextRequest(`http://localhost/api/invites/${token}/accept`, {
      method: 'POST',
      headers: { Authorization: 'Bearer firebase-token' },
    });

  const decodedToken = {
    uid: 'firebase-uid',
    email: 'member@example.com',
    name: 'New Member',
  };

  const existingUser = {
    id: 'firebase-uid',
    email: 'member@example.com',
    name: 'New Member',
    role: 'pending',
    businessId: null,
    locationId: null,
    isActive: true,
    preferences: {},
  };

  const updatedUser = {
    ...existingUser,
    role: 'miembro',
    businessId: 'biz-1',
  };

  beforeEach(() => {
    mockVerifyToken.mockResolvedValue(decodedToken as never);
    mockGetEffectivePlanConfig.mockResolvedValue({
      limits: { users: -1 },
    } as never);
  });

  it('retorna 401 si no hay Authorization header', async () => {
    const req = new NextRequest('http://localhost/api/invites/inv-1/accept', {
      method: 'POST',
    });
    const res = await acceptPOST(req, makeParams('inv-1'));
    expect(res.status).toBe(401);
  });

  it('retorna 401 si verifyToken lanza error', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('invalid token'));
    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(401);
  });

  it('retorna 410 si la invitación no existe o está inactiva', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce(null as never);
    const res = await acceptPOST(makeAuthedRequest(), makeParams('bad-token'));
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toBe('invite_revoked');
  });

  it('retorna 410 si la invitación tiene isActive=false', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'basic', name: 'Acme Corp' },
      isActive: false,
    } as never);
    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toBe('invite_revoked');
  });

  it('retorna 410 si la invitación ha expirado', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'basic', name: 'Acme Corp' },
      expiresAt: new Date('2000-01-01'),
    } as never);
    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toBe('invite_expired');
  });

  it('retorna 410 si se superó el máximo de usos', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'basic', name: 'Acme Corp' },
      maxUses: 3,
      usedCount: 3,
    } as never);
    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toBe('invite_max_uses');
  });

  it('retorna 404 si el usuario no existe y no tiene email en el token', async () => {
    mockVerifyToken.mockResolvedValueOnce({ uid: 'unknown-uid' } as never);
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'basic', name: 'Acme Corp' },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null as never);

    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('user_not_found');
  });

  it('retorna 409 si el usuario ya es miembro activo', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'basic', name: 'Acme Corp' },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as never);
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce({
      userId: 'firebase-uid',
      businessId: 'biz-1',
      isActive: true,
    } as never);

    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('already_member');
  });

  it('retorna 429 si se supera el límite de usuarios del plan', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'basic', name: 'Acme Corp' },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as never);
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce(null as never);
    mockGetEffectivePlanConfig.mockResolvedValueOnce({
      limits: { users: 5 },
    } as never);
    vi.mocked(prisma.userBusiness.count).mockResolvedValueOnce(5 as never);

    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('members_limit_exceeded');
    expect(body.limit).toBe(5);
    expect(body.current).toBe(5);
  });

  it('acepta invitación y crea membresía nueva', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'free', name: 'Acme Corp' },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as never);
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.userBusiness.count).mockResolvedValueOnce(0 as never);
    vi.mocked(prisma.userBusiness.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updatedUser as never);
    vi.mocked(prisma.businessInvite.update).mockResolvedValueOnce({
      ...mockInvite,
      usedCount: 1,
    } as never);
    vi.mocked(prisma.userBusiness.findMany).mockResolvedValueOnce([] as never);

    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.businessId).toBe('biz-1');
    expect(body.role).toBe('miembro');
  });

  it('reactiva membresía inactiva en lugar de crear una nueva', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'free', name: 'Acme Corp' },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as never);
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce({
      userId: 'firebase-uid',
      businessId: 'biz-1',
      isActive: false,
    } as never);
    vi.mocked(prisma.userBusiness.update).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updatedUser as never);
    vi.mocked(prisma.businessInvite.update).mockResolvedValueOnce({
      ...mockInvite,
      usedCount: 1,
    } as never);
    vi.mocked(prisma.userBusiness.findMany).mockResolvedValueOnce([] as never);

    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(200);
    expect(prisma.userBusiness.create).not.toHaveBeenCalled();
    expect(prisma.userBusiness.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it('auto-provisiona usuario nuevo si no existe en DB pero tiene email en el token', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'free', name: 'Acme Corp' },
    } as never);
    // findUnique returns null (no user by UID)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null as never);
    // findFirst by email also returns null
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null as never);
    // create new user
    vi.mocked(prisma.user.create).mockResolvedValueOnce(existingUser as never);
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.userBusiness.count).mockResolvedValueOnce(0 as never);
    vi.mocked(prisma.userBusiness.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updatedUser as never);
    vi.mocked(prisma.businessInvite.update).mockResolvedValueOnce({
      ...mockInvite,
      usedCount: 1,
    } as never);
    vi.mocked(prisma.userBusiness.findMany).mockResolvedValueOnce([] as never);

    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(200);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'firebase-uid',
          email: 'member@example.com',
          role: 'pending',
          preferences: expect.objectContaining({
            accountIntent: 'collaborator',
            joinedViaInviteAt: expect.any(String),
          }),
        }),
      })
    );
    expect(prisma.business.create).not.toHaveBeenCalled();
  });

  it('incrementa usedCount de la invitación al aceptar', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'free', name: 'Acme Corp' },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as never);
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.userBusiness.count).mockResolvedValueOnce(0 as never);
    vi.mocked(prisma.userBusiness.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updatedUser as never);
    vi.mocked(prisma.businessInvite.update).mockResolvedValueOnce({
      ...mockInvite,
      usedCount: 1,
    } as never);
    vi.mocked(prisma.userBusiness.findMany).mockResolvedValueOnce([] as never);

    await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(prisma.businessInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: { usedCount: { increment: 1 } },
      })
    );
  });

  it('escribe audit log con acción user.join_via_invite', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'free', name: 'Acme Corp' },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as never);
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.userBusiness.count).mockResolvedValueOnce(0 as never);
    vi.mocked(prisma.userBusiness.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updatedUser as never);
    vi.mocked(prisma.businessInvite.update).mockResolvedValueOnce({
      ...mockInvite,
      usedCount: 1,
    } as never);
    vi.mocked(prisma.userBusiness.findMany).mockResolvedValueOnce([] as never);

    await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.join_via_invite' })
    );
  });

  it('verifica límite del plan al reactivar membresía existente', async () => {
    vi.mocked(prisma.businessInvite.findUnique).mockResolvedValueOnce({
      ...mockInviteWithBusiness,
      business: { plan: 'free', name: 'Acme Corp' },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as never);
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce({
      userId: 'firebase-uid',
      businessId: 'biz-1',
      isActive: false,
    } as never);
    mockGetEffectivePlanConfig.mockReset();
    mockGetEffectivePlanConfig.mockResolvedValue({ limits: { users: 2 } } as never);
    vi.mocked(prisma.userBusiness.count).mockReset();
    vi.mocked(prisma.userBusiness.count).mockResolvedValue(2 as never);

    const res = await acceptPOST(makeAuthedRequest(), makeParams('inv-1'));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('members_limit_exceeded');
    expect(mockGetEffectivePlanConfig).toHaveBeenCalledWith('free');
    expect(prisma.userBusiness.count).toHaveBeenCalled();
  });
});
