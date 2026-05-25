import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tasks/[id]/time-entries/route';
import { timeEntryService } from '@/services/time-entry.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn().mockReturnValue(null),
  requireActiveSubscription: vi.fn().mockReturnValue(null),
}));
vi.mock('@/services/time-entry.service', () => ({
  timeEntryService: {
    getByTask: vi.fn(),
    create: vi.fn(),
  },
}));

const mockRequireUser = vi.mocked(requireUser);
const mockGetEntries = vi.mocked(timeEntryService.getByTask);
const mockCreate = vi.mocked(timeEntryService.create);

const authedUser = {
  uid: 'user-1',
  role: 'miembro',
  businessId: 'biz-1',
  email: 'user@biz.com',
  name: 'Usuario',
  data: { id: 'user-1', role: 'miembro', businessId: 'biz-1' },
};

const mockEntries = [
  { id: 'te-1', taskId: 'task-1', userId: 'user-1', hours: 2, date: new Date(), user: { id: 'user-1', name: 'Ana', avatar: null } },
  { id: 'te-2', taskId: 'task-1', userId: 'user-2', hours: 1.5, date: new Date(), user: { id: 'user-2', name: 'Bob', avatar: null } },
];

function makeRequest(taskId: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost/api/tasks/${taskId}/time-entries`, options as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(authedUser as never);
  vi.mocked(prisma.task.findUnique).mockResolvedValue({ project: { businessId: 'biz-1' }, location: null, creator: null } as never);
});

// ─── GET /api/tasks/[id]/time-entries ─────────────────────────────────────────

describe('GET /api/tasks/[id]/time-entries', () => {
  it('retorna entradas de tiempo de la tarea', async () => {
    mockGetEntries.mockResolvedValueOnce(mockEntries as never);
    const req = makeRequest('task-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(mockGetEntries).toHaveBeenCalledWith('task-1');
  });

  it('retorna array vacío si no hay entradas', async () => {
    mockGetEntries.mockResolvedValueOnce([] as never);
    const req = makeRequest('task-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('retorna 500 si el service lanza error', async () => {
    mockGetEntries.mockRejectedValueOnce(new Error('DB error'));
    const req = makeRequest('task-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/tasks/[id]/time-entries ────────────────────────────────────────

describe('POST /api/tasks/[id]/time-entries', () => {
  it('crea entrada de tiempo y retorna 201', async () => {
    const newEntry = { id: 'te-new', taskId: 'task-1', userId: 'user-1', hours: 3 };
    mockCreate.mockResolvedValueOnce(newEntry as never);

    const req = makeRequest('task-1', {
      method: 'POST',
      body: JSON.stringify({ hours: 3, note: 'Revisión' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('te-new');
  });

  it('pasa taskId y userId del usuario autenticado', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'x' } as never);
    const req = makeRequest('task-xyz', {
      method: 'POST',
      body: JSON.stringify({ hours: 1.5 }),
    });
    await POST(req, { params: Promise.resolve({ id: 'task-xyz' }) });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 'task-xyz', userId: 'user-1', hours: 1.5 })
    );
  });

  it('retorna 400 si hours no es válido', async () => {
    const req = makeRequest('task-1', {
      method: 'POST',
      body: JSON.stringify({ hours: -1 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(400);
  });

  it('retorna 400 si hours es cero', async () => {
    const req = makeRequest('task-1', {
      method: 'POST',
      body: JSON.stringify({ hours: 0 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(400);
  });

  it('retorna 500 si el service lanza error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB error'));
    const req = makeRequest('task-1', {
      method: 'POST',
      body: JSON.stringify({ hours: 2 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(500);
  });
});
