import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/tasks/replicate/route';
import { taskService } from '@/services/task.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { getTaskBusinessId } from '@/lib/api/task-business';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireActiveSubscription: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/api/task-business', () => ({
  getTaskBusinessId: vi.fn(),
}));

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn(),
}));

vi.mock('@/services/task.service', () => ({
  taskService: {
    getTaskById: vi.fn(),
    getSubtasks: vi.fn(),
    validateProjectIdsForBusiness: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
  },
}));

const mockRequireUser = vi.mocked(requireUser);
const mockValidate = vi.mocked(taskService.validateProjectIdsForBusiness);
const mockCreate = vi.mocked(taskService.createTask);
const mockGetTask = vi.mocked(taskService.getTaskById);
const mockGetSubtasks = vi.mocked(taskService.getSubtasks);
const mockGetBusinessId = vi.mocked(getTaskBusinessId);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/tasks/replicate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue({
    uid: 'user-1',
    role: 'admin',
    businessId: 'biz-1',
    email: 'admin@biz.com',
    name: 'Admin',
    data: { id: 'user-1', role: 'admin', businessId: 'biz-1' },
  } as never);
  mockValidate.mockResolvedValue(undefined);
});

describe('POST /api/tasks/replicate', () => {
  it('retorna 400 sin projectIds', async () => {
    const res = await POST(makeRequest({ template: { title: 'X', status: 'todo', priority: 'medium', type: 'task', assigneeIds: [], tags: [] } }));
    expect(res.status).toBe(400);
  });

  it('crea copias con template en dos tableros', async () => {
    mockCreate
      .mockResolvedValueOnce({ id: 't1', title: 'Copia', projectId: 'p1' } as never)
      .mockResolvedValueOnce({ id: 't2', title: 'Copia', projectId: 'p2' } as never);

    const res = await POST(
      makeRequest({
        projectIds: ['p1', 'p2'],
        template: {
          title: 'Copia',
          status: 'todo',
          priority: 'medium',
          type: 'task',
          assigneeIds: [],
          tags: [],
        },
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.count).toBe(2);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate.mock.calls[0][0].projectId).toBe('p1');
    expect(mockCreate.mock.calls[1][0].projectId).toBe('p2');
  });

  it('retorna 403 si validateProjectIds falla con forbidden', async () => {
    mockValidate.mockRejectedValueOnce(new Error('forbidden'));
    const res = await POST(
      makeRequest({
        projectIds: ['p-other-tenant'],
        template: {
          title: 'X',
          status: 'todo',
          priority: 'medium',
          type: 'task',
          assigneeIds: [],
          tags: [],
        },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('duplica desde sourceTaskId', async () => {
    mockGetTask.mockResolvedValueOnce({
      id: 'src',
      title: 'Original',
      description: 'Desc',
      status: 'done',
      priority: 'high',
      type: 'task',
      assigneeIds: ['u1'],
      tags: ['a'],
      checklist: [{ id: 'c1', text: 'Paso', done: true }],
    } as never);
    mockGetBusinessId.mockResolvedValueOnce('biz-1');
    mockGetSubtasks.mockResolvedValueOnce([{ id: 'sub1', title: 'Sub A' }] as never);
    mockCreate
      .mockResolvedValueOnce({ id: 't1', title: 'Original', projectId: 'p1' } as never)
      .mockResolvedValueOnce({ id: 'sub-new', title: 'Sub A' } as never);
    vi.mocked(taskService.updateTask).mockResolvedValueOnce({ id: 'sub-new' } as never);

    const res = await POST(makeRequest({ projectIds: ['p1'], sourceTaskId: 'src' }));
    expect(res.status).toBe(201);
    expect(mockCreate.mock.calls[0][0].status).toBe('todo');
    expect(mockCreate.mock.calls[0][0].checklist?.[0].done).toBe(false);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
