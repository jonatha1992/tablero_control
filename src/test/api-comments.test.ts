import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tasks/[id]/comments/route';
import { commentService } from '@/services/comment.service';
import { requireUser } from '@/lib/api/auth-helpers';

vi.mock('@/lib/api/auth-helpers', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/api/audit', () => ({ writeAuditLog: vi.fn() }));
vi.mock('@/lib/notifications', () => ({ sendNotification: vi.fn() }));
vi.mock('@/services/comment.service', () => ({
  commentService: {
    getCommentsByTask: vi.fn(),
    addComment: vi.fn(),
  },
}));
vi.mock('@/services/task.service', () => ({
  taskService: {
    getTaskById: vi.fn(),
  },
}));

import { taskService } from '@/services/task.service';
import { prisma } from '@/lib/prisma';

const mockRequireUser = vi.mocked(requireUser);
const mockGetComments = vi.mocked(commentService.getCommentsByTask);
const mockAdd = vi.mocked(commentService.addComment);
const mockGetTask = vi.mocked(taskService.getTaskById);
const mockTaskFindUnique = vi.mocked(prisma.task.findUnique);

const mockTask = { id: 'task-1', title: 'Tarea Test', assigneeIds: [] };

const authedUser = {
  uid: 'user-1',
  role: 'miembro',
  businessId: 'biz-1',
  email: 'user@biz.com',
  name: 'Usuario',
  data: { id: 'user-1', role: 'miembro', businessId: 'biz-1', name: 'Usuario', email: 'user@biz.com' },
};

const mockComments = [
  { id: 'cmt-1', taskId: 'task-1', authorId: 'user-1', content: 'Hola', createdAt: new Date() },
  { id: 'cmt-2', taskId: 'task-1', authorId: 'user-2', content: 'Mundo', createdAt: new Date() },
];

function makeRequest(taskId: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost/api/tasks/${taskId}/comments`, options as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(authedUser as never);
  mockGetTask.mockResolvedValue(mockTask as never);
  mockTaskFindUnique.mockResolvedValue({ project: { businessId: 'biz-1' }, location: null, creator: null } as never);
});

// ─── GET /api/tasks/[id]/comments ────────────────────────────────────────────

describe('GET /api/tasks/[id]/comments', () => {
  it('retorna comentarios de la tarea', async () => {
    mockGetComments.mockResolvedValueOnce(mockComments as never);
    const req = makeRequest('task-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(mockGetComments).toHaveBeenCalledWith('task-1');
  });

  it('retorna array vacío si no hay comentarios', async () => {
    mockGetComments.mockResolvedValueOnce([] as never);
    const req = makeRequest('task-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('retorna 500 si el service lanza error', async () => {
    mockGetComments.mockRejectedValueOnce(new Error('DB error'));
    const req = makeRequest('task-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/tasks/[id]/comments ───────────────────────────────────────────

describe('POST /api/tasks/[id]/comments', () => {
  it('agrega comentario y retorna 201', async () => {
    const newComment = { id: 'cmt-new', taskId: 'task-1', authorId: 'user-1', content: 'Nuevo comentario' };
    mockAdd.mockResolvedValueOnce(newComment as never);

    const req = makeRequest('task-1', {
      method: 'POST',
      body: JSON.stringify({ content: 'Nuevo comentario' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('cmt-new');
  });

  it('pasa taskId y authorId correctamente', async () => {
    mockAdd.mockResolvedValueOnce({ id: 'x' } as never);
    const req = makeRequest('task-abc', {
      method: 'POST',
      body: JSON.stringify({ content: 'Comentario' }),
    });
    await POST(req, { params: Promise.resolve({ id: 'task-abc' }) });
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 'task-abc', authorId: 'user-1' })
    );
  });

  it('retorna 404 si la tarea no existe', async () => {
    mockGetTask.mockResolvedValueOnce(null as never);
    const req = makeRequest('task-nope', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hola' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'task-nope' }) });
    expect(res.status).toBe(404);
  });

  it('retorna 500 si contenido vacío lanza error de servicio', async () => {
    mockAdd.mockRejectedValueOnce(new Error('El comentario no puede estar vacío'));
    const req = makeRequest('task-1', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'task-1' }) });
    expect(res.status).toBe(500);
  });
});
