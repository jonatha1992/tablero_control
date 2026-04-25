import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tasks/route';
import { taskService } from '@/services/task.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/services/task.service', () => ({
  taskService: {
    getTasksByBusiness: vi.fn(),
    getTasksByCreator: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    moveTask: vi.fn(),
    deleteTask: vi.fn(),
    getTaskById: vi.fn(),
  },
}));

const mockGetByBusiness = vi.mocked(taskService.getTasksByBusiness);
const mockGetByCreator = vi.mocked(taskService.getTasksByCreator);
const mockCreate = vi.mocked(taskService.createTask);

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options);
}

const mockTasks = [
  { id: 't-1', title: 'Tarea 1', status: 'todo', priority: 'medium', businessId: 'biz-1' },
  { id: 't-2', title: 'Tarea 2', status: 'in_progress', priority: 'high', businessId: 'biz-1' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/tasks ────────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  it('retorna 400 si no se proporciona businessId ni creatorId', async () => {
    const req = makeRequest('http://localhost/api/tasks');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/businessId|creatorId/i);
  });

  it('lista tareas por businessId', async () => {
    mockGetByBusiness.mockResolvedValueOnce(mockTasks as never);
    const req = makeRequest('http://localhost/api/tasks?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(mockGetByBusiness).toHaveBeenCalledWith('biz-1', expect.any(Object));
  });

  it('lista tareas por creatorId cuando no hay businessId', async () => {
    mockGetByCreator.mockResolvedValueOnce([mockTasks[0]] as never);
    const req = makeRequest('http://localhost/api/tasks?creatorId=user-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockGetByCreator).toHaveBeenCalledWith('user-1', expect.any(Object));
  });

  it('pasa filtro de status correctamente', async () => {
    mockGetByBusiness.mockResolvedValueOnce([mockTasks[0]] as never);
    const req = makeRequest('http://localhost/api/tasks?businessId=biz-1&status=todo');
    await GET(req);
    expect(mockGetByBusiness).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ status: ['todo'] })
    );
  });

  it('pasa filtro de priority correctamente', async () => {
    mockGetByBusiness.mockResolvedValueOnce([mockTasks[1]] as never);
    const req = makeRequest('http://localhost/api/tasks?businessId=biz-1&priority=high,urgent');
    await GET(req);
    expect(mockGetByBusiness).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ priority: ['high', 'urgent'] })
    );
  });

  it('retorna 500 si el service lanza error', async () => {
    mockGetByBusiness.mockRejectedValueOnce(new Error('DB error'));
    const req = makeRequest('http://localhost/api/tasks?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/tasks ───────────────────────────────────────────────────────────

describe('POST /api/tasks', () => {
  it('crea tarea y retorna 201', async () => {
    const newTask = { id: 't-new', title: 'Nueva', status: 'todo' };
    mockCreate.mockResolvedValueOnce(newTask as never);

    const req = makeRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        dto: { title: 'Nueva', status: 'todo', priority: 'medium' },
        creatorId: 'user-1',
        businessId: 'biz-1',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('t-new');
  });

  it('llama taskService.createTask con dto, creatorId y businessId', async () => {
    mockCreate.mockResolvedValueOnce({ id: 't-x' } as never);
    const dto = { title: 'Test', priority: 'low' };

    const req = makeRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ dto, creatorId: 'u-1', businessId: 'biz-1' }),
    });
    await POST(req);
    expect(mockCreate).toHaveBeenCalledWith(dto, 'u-1', 'biz-1');
  });

  it('retorna 500 si el service lanza error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB error'));
    const req = makeRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ dto: {}, creatorId: 'u-1', businessId: 'biz-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
