import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/api/auth-helpers', () => ({ requireUser: vi.fn() }));

// Extend the global prisma mock (from setup.ts) with the notification model
vi.mock('@/lib/prisma', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/prisma')>();
  return {
    ...original,
    prisma: {
      ...(original.prisma as object),
      notification: {
        findMany: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
      },
    },
  };
});

import { GET as getList, PATCH as patchAll } from '@/app/api/notifications/route';
import { PATCH as patchOne } from '@/app/api/notifications/[id]/route';

const mockRequireUser = vi.mocked(requireUser);
const mockFindMany = vi.mocked(prisma.notification.findMany);
const mockCount = vi.mocked(prisma.notification.count);
const mockUpdateMany = vi.mocked(prisma.notification.updateMany);

const authedUser = {
  uid: 'user-1',
  role: 'admin',
  businessId: 'biz-1',
  email: 'a@b.com',
  data: { id: 'user-1', role: 'admin', businessId: 'biz-1' },
} as never;

const mockNotifications = [
  { id: 'notif-1', userId: 'user-1', title: 'Tarea asignada', body: 'Se te asignó una tarea', type: 'task_assigned', read: false, createdAt: new Date() },
  { id: 'notif-2', userId: 'user-1', title: 'Actualización', body: 'La tarea fue actualizada', type: 'task_updated', read: true, createdAt: new Date() },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(authedUser);
});

// ─── GET /api/notifications ───────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  it('retorna 401 si el usuario no está autenticado', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireUser.mockResolvedValueOnce(
      NextResponse.json({ error: 'unauthorized' }, { status: 401 }) as never
    );
    const req = new NextRequest('http://localhost/api/notifications');
    const res = await getList(req);
    expect(res.status).toBe(401);
  });

  it('retorna notificaciones del usuario con unreadCount', async () => {
    mockFindMany.mockResolvedValueOnce(mockNotifications as never);
    mockCount.mockResolvedValueOnce(1 as never);

    const req = new NextRequest('http://localhost/api/notifications');
    const res = await getList(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(2);
    expect(body.unreadCount).toBe(1);
  });

  it('consulta solo las notificaciones del usuario autenticado', async () => {
    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount.mockResolvedValueOnce(0 as never);

    const req = new NextRequest('http://localhost/api/notifications');
    await getList(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    );
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', read: false } })
    );
  });

  it('retorna máximo 30 notificaciones', async () => {
    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount.mockResolvedValueOnce(0 as never);

    const req = new NextRequest('http://localhost/api/notifications');
    await getList(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 30 })
    );
  });

  it('ordena por createdAt descendente', async () => {
    mockFindMany.mockResolvedValueOnce(mockNotifications as never);
    mockCount.mockResolvedValueOnce(0 as never);

    const req = new NextRequest('http://localhost/api/notifications');
    await getList(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    );
  });

  it('retorna unreadCount 0 cuando todas están leídas', async () => {
    const allRead = mockNotifications.map((n) => ({ ...n, read: true }));
    mockFindMany.mockResolvedValueOnce(allRead as never);
    mockCount.mockResolvedValueOnce(0 as never);

    const req = new NextRequest('http://localhost/api/notifications');
    const res = await getList(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unreadCount).toBe(0);
  });

  it('retorna lista vacía si el usuario no tiene notificaciones', async () => {
    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount.mockResolvedValueOnce(0 as never);

    const req = new NextRequest('http://localhost/api/notifications');
    const res = await getList(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toEqual([]);
    expect(body.unreadCount).toBe(0);
  });
});

// ─── PATCH /api/notifications — marcar todas como leídas ─────────────────────

describe('PATCH /api/notifications', () => {
  it('retorna 401 si el usuario no está autenticado', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireUser.mockResolvedValueOnce(
      NextResponse.json({ error: 'unauthorized' }, { status: 401 }) as never
    );
    const req = new NextRequest('http://localhost/api/notifications', { method: 'PATCH' });
    const res = await patchAll(req);
    expect(res.status).toBe(401);
  });

  it('marca todas las notificaciones no leídas como leídas', async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 } as never);

    const req = new NextRequest('http://localhost/api/notifications', { method: 'PATCH' });
    const res = await patchAll(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('filtra por userId y read: false en updateMany', async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 2 } as never);

    const req = new NextRequest('http://localhost/api/notifications', { method: 'PATCH' });
    await patchAll(req);

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', read: false },
        data: { read: true },
      })
    );
  });

  it('retorna ok: true aunque no haya notificaciones no leídas', async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 0 } as never);

    const req = new NextRequest('http://localhost/api/notifications', { method: 'PATCH' });
    const res = await patchAll(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

// ─── PATCH /api/notifications/[id] — marcar una como leída ───────────────────

describe('PATCH /api/notifications/[id]', () => {
  it('retorna 401 si el usuario no está autenticado', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireUser.mockResolvedValueOnce(
      NextResponse.json({ error: 'unauthorized' }, { status: 401 }) as never
    );
    const req = new NextRequest('http://localhost/api/notifications/notif-1', { method: 'PATCH' });
    const res = await patchOne(req, { params: Promise.resolve({ id: 'notif-1' }) });
    expect(res.status).toBe(401);
  });

  it('marca una notificación específica como leída', async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 } as never);

    const req = new NextRequest('http://localhost/api/notifications/notif-1', { method: 'PATCH' });
    const res = await patchOne(req, { params: Promise.resolve({ id: 'notif-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('filtra por id y userId para evitar acceso cross-user', async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 } as never);

    const req = new NextRequest('http://localhost/api/notifications/notif-1', { method: 'PATCH' });
    await patchOne(req, { params: Promise.resolve({ id: 'notif-1' }) });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { read: true },
      })
    );
  });

  it('retorna ok: true aunque la notificación no exista o no pertenezca al usuario', async () => {
    // updateMany returns count: 0 when no rows matched — the route still returns ok
    mockUpdateMany.mockResolvedValueOnce({ count: 0 } as never);

    const req = new NextRequest('http://localhost/api/notifications/notif-unknown', { method: 'PATCH' });
    const res = await patchOne(req, { params: Promise.resolve({ id: 'notif-unknown' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('usa el id del parámetro de ruta correcto', async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 } as never);

    const req = new NextRequest('http://localhost/api/notifications/notif-99', { method: 'PATCH' });
    await patchOne(req, { params: Promise.resolve({ id: 'notif-99' }) });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'notif-99' }) })
    );
  });
});
