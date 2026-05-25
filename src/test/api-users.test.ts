import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/api/route-handler', () => ({
  handle: (fn: (req: NextRequest) => unknown) => fn,
}));

const mockRequireUser = vi.mocked(requireUser);
const mockWriteAuditLog = vi.mocked(writeAuditLog);

const authedUser = {
  uid: 'user-1',
  role: 'admin' as const,
  businessId: 'biz-1',
  email: 'a@b.com',
  data: {
    id: 'user-1',
    role: 'admin',
    businessId: 'biz-1',
    memberships: [{ businessId: 'biz-1', role: 'admin', isActive: true }],
  },
};

const makeRequest = (url: string, body?: unknown, method = 'GET') =>
  new NextRequest(`http://localhost${url}`, {
    method: body ? (method === 'GET' ? 'PATCH' : method) : method,
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(authedUser as never);
});

// ─── PATCH /api/users/me ─────────────────────────────────────────────────────

describe('PATCH /api/users/me', () => {
  async function callPatch(body: unknown) {
    const { PATCH } = await import('@/app/api/users/me/route');
    const req = makeRequest('/api/users/me', body, 'PATCH');
    return PATCH(req);
  }

  it('actualiza el nombre y retorna el usuario actualizado', async () => {
    const updated = { id: 'user-1', name: 'Nuevo Nombre', email: 'a@b.com', role: 'admin', avatar: null, phone: null };
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updated as never);

    const res = await callPatch({ name: 'Nuevo Nombre' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Nuevo Nombre');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { name: 'Nuevo Nombre' },
      }),
    );
  });

  it('actualiza avatar y phone', async () => {
    const updated = { id: 'user-1', name: 'Admin', email: 'a@b.com', role: 'admin', avatar: 'https://cdn.example.com/av.jpg', phone: '+54911' };
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updated as never);

    const res = await callPatch({ avatar: 'https://cdn.example.com/av.jpg', phone: '+54911' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.avatar).toBe('https://cdn.example.com/av.jpg');
    expect(body.phone).toBe('+54911');
  });

  it('escribe audit log tras la actualización', async () => {
    const updated = { id: 'user-1', name: 'X', email: 'a@b.com', role: 'admin', avatar: null, phone: null };
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updated as never);

    await callPatch({ name: 'X' });

    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        action: 'user.update',
        targetType: 'USER',
        targetId: 'user-1',
      }),
    );
  });

  it('retorna 401 si requireUser devuelve NextResponse', async () => {
    mockRequireUser.mockResolvedValueOnce(NextResponse.json({ error: 'unauthorized' }, { status: 401 }) as never);

    const res = await callPatch({ name: 'X' });

    expect(res.status).toBe(401);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('no incluye campos undefined en el data de la actualización', async () => {
    const updated = { id: 'user-1', name: 'Admin', email: 'a@b.com', role: 'admin', avatar: null, phone: null };
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updated as never);

    await callPatch({ phone: '+1234' });

    const call = vi.mocked(prisma.user.update).mock.calls[0][0] as { data: Record<string, unknown> };
    expect(call.data).not.toHaveProperty('name');
    expect(call.data).not.toHaveProperty('avatar');
    expect(call.data).toHaveProperty('phone', '+1234');
  });
});

// ─── POST /api/users/switch-business ─────────────────────────────────────────

describe('POST /api/users/switch-business', () => {
  async function callSwitch(body: unknown) {
    const { POST } = await import('@/app/api/users/switch-business/route');
    const req = makeRequest('/api/users/switch-business', body, 'POST');
    return POST(req);
  }

  it('cambia de negocio cuando la membresía es activa', async () => {
    const membership = { userId: 'user-1', businessId: 'biz-2', role: 'miembro', locationId: null, isActive: true };
    const updatedUser = { id: 'user-1', businessId: 'biz-2', role: 'miembro', teams: [], memberships: [] };

    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce(membership as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updatedUser as never);

    const res = await callSwitch({ businessId: 'biz-2' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.businessId).toBe('biz-2');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ businessId: 'biz-2', role: 'miembro' }),
      }),
    );
  });

  it('retorna 400 si no se envía businessId', async () => {
    const res = await callSwitch({});

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('businessId_required');
    expect(prisma.userBusiness.findUnique).not.toHaveBeenCalled();
  });

  it('retorna 403 si no existe membresía', async () => {
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce(null);

    const res = await callSwitch({ businessId: 'biz-999' });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('not_a_member');
  });

  it('retorna 403 si la membresía está inactiva', async () => {
    const membership = { userId: 'user-1', businessId: 'biz-2', role: 'miembro', locationId: null, isActive: false };
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce(membership as never);

    const res = await callSwitch({ businessId: 'biz-2' });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('not_a_member');
  });

  it('retorna 401 si requireUser devuelve NextResponse', async () => {
    mockRequireUser.mockResolvedValueOnce(NextResponse.json({ error: 'unauthorized' }, { status: 401 }) as never);

    const res = await callSwitch({ businessId: 'biz-2' });

    expect(res.status).toBe(401);
    expect(prisma.userBusiness.findUnique).not.toHaveBeenCalled();
  });

  it('actualiza locationId desde la membresía', async () => {
    const membership = { userId: 'user-1', businessId: 'biz-2', role: 'responsable', locationId: 'loc-5', isActive: true };
    const updatedUser = { id: 'user-1', businessId: 'biz-2', role: 'responsable', locationId: 'loc-5', teams: [], memberships: [] };

    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce(membership as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce(updatedUser as never);

    const res = await callSwitch({ businessId: 'biz-2' });

    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locationId: 'loc-5' }),
      }),
    );
  });
});

// ─── POST /api/users/fcm-token ────────────────────────────────────────────────

describe('POST /api/users/fcm-token', () => {
  async function callFcm(body: unknown) {
    const { POST } = await import('@/app/api/users/fcm-token/route');
    const req = makeRequest('/api/users/fcm-token', body, 'POST');
    return POST(req);
  }

  it('agrega un token FCM nuevo', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ fcmTokens: [] } as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

    const res = await callFcm({ token: 'fcm-abc', action: 'add' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { fcmTokens: ['fcm-abc'] },
      }),
    );
  });

  it('no duplica un token FCM existente', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ fcmTokens: ['fcm-abc'] } as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

    await callFcm({ token: 'fcm-abc', action: 'add' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { fcmTokens: ['fcm-abc'] },
      }),
    );
  });

  it('elimina un token FCM existente', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ fcmTokens: ['fcm-abc', 'fcm-xyz'] } as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

    const res = await callFcm({ token: 'fcm-abc', action: 'remove' });

    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { fcmTokens: ['fcm-xyz'] },
      }),
    );
  });

  it('retorna 400 si el body es inválido (sin token)', async () => {
    const res = await callFcm({ action: 'add' });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
  });

  it('retorna 400 si action no es válida', async () => {
    const res = await callFcm({ token: 'fcm-abc', action: 'invalid' });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
  });

  it('retorna 404 si el usuario no existe en DB', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const res = await callFcm({ token: 'fcm-abc', action: 'add' });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('user_not_found');
  });

  it('retorna 401 si requireUser devuelve NextResponse', async () => {
    mockRequireUser.mockResolvedValueOnce(NextResponse.json({ error: 'unauthorized' }, { status: 401 }) as never);

    const res = await callFcm({ token: 'fcm-abc', action: 'add' });

    expect(res.status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('maneja un token add cuando fcmTokens es null en DB', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ fcmTokens: null } as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

    const res = await callFcm({ token: 'new-token', action: 'add' });

    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { fcmTokens: ['new-token'] },
      }),
    );
  });
});
