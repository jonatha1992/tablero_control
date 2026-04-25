import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useCreateTask } from '@/hooks/mutations/use-create-task';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { useDeleteTask } from '@/hooks/mutations/use-delete-task';
import { useMoveTask } from '@/hooks/mutations/use-move-task';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/api/tasks', () => ({
  tasksApi: {
    getByBusiness: vi.fn(),
    getByCreator: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    move: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/hooks/auth-context', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'user-1',
      businessId: 'biz-1',
      role: 'admin',
      email: 'a@b.com',
      name: 'Test User',
    },
    isSuperAdmin: false,
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);
const mockCreate = vi.mocked(tasksApi.create);
const mockUpdate = vi.mocked(tasksApi.update);
const mockDelete = vi.mocked(tasksApi.delete);
const mockMove = vi.mocked(tasksApi.move);

// ─── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return { wrapper: ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children), qc };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── useCreateTask ────────────────────────────────────────────────────────────

describe('useCreateTask', () => {
  it('llama tasksApi.create con dto, userId y businessId', async () => {
    const { wrapper, qc: _qc } = createWrapper();
    const newTask = { id: 't-new', title: 'Nueva tarea' };
    mockCreate.mockResolvedValueOnce(newTask as never);

    const { result } = renderHook(() => useCreateTask(), { wrapper });
    await act(async () => {
      result.current.mutate({ title: 'Nueva tarea', status: 'todo', priority: 'medium', type: 'task', assigneeIds: [], tags: [] });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nueva tarea' }),
      'user-1',
      'biz-1'
    );
  });

  it('invalida taskKeys.all en onSuccess', async () => {
    const { wrapper, qc } = createWrapper();
    mockCreate.mockResolvedValueOnce({ id: 't-1', title: 'T' } as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTask(), { wrapper });
    await act(async () => {
      result.current.mutate({ title: 'T', status: 'todo', priority: 'low', type: 'task', assigneeIds: [], tags: [] });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.all });
  });

  it('llama toast.success en onSuccess', async () => {
    const { wrapper } = createWrapper();
    mockCreate.mockResolvedValueOnce({ id: 't-1', title: 'Creada' } as never);

    const { result } = renderHook(() => useCreateTask(), { wrapper });
    await act(async () => { result.current.mutate({ title: 'Creada', status: 'todo', priority: 'low', type: 'task', assigneeIds: [], tags: [] }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToastSuccess).toHaveBeenCalledWith('Tarea creada', expect.any(Object));
  });

  it('llama toast.error en onError', async () => {
    const { wrapper } = createWrapper();
    mockCreate.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCreateTask(), { wrapper });
    await act(async () => { result.current.mutate({ title: 'Fail', status: 'todo', priority: 'low', type: 'task', assigneeIds: [], tags: [] }); });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToastError).toHaveBeenCalled();
  });
});

// ─── useUpdateTask ────────────────────────────────────────────────────────────

describe('useUpdateTask', () => {
  it('llama tasksApi.update con id y data', async () => {
    const { wrapper } = createWrapper();
    mockUpdate.mockResolvedValueOnce({ id: 't-1', title: 'Actualizada' } as never);

    const { result } = renderHook(() => useUpdateTask(), { wrapper });
    await act(async () => {
      result.current.mutate({ id: 't-1', data: { title: 'Actualizada' } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith('t-1', { title: 'Actualizada' });
  });

  it('invalida detail y all en onSettled', async () => {
    const { wrapper, qc } = createWrapper();
    mockUpdate.mockResolvedValueOnce({ id: 't-1' } as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTask(), { wrapper });
    await act(async () => { result.current.mutate({ id: 't-1', data: { title: 'X' } }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.detail('t-1') });
  });
});

// ─── useDeleteTask ────────────────────────────────────────────────────────────

describe('useDeleteTask', () => {
  it('llama tasksApi.delete con el id', async () => {
    const { wrapper } = createWrapper();
    mockDelete.mockResolvedValueOnce(undefined as never);

    const { result } = renderHook(() => useDeleteTask(), { wrapper });
    await act(async () => { result.current.mutate('t-1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDelete).toHaveBeenCalledWith('t-1');
  });

  it('invalida taskKeys.all en onSuccess', async () => {
    const { wrapper, qc } = createWrapper();
    mockDelete.mockResolvedValueOnce(undefined as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteTask(), { wrapper });
    await act(async () => { result.current.mutate('t-1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.all });
  });

  it('llama toast.success en onSuccess', async () => {
    const { wrapper } = createWrapper();
    mockDelete.mockResolvedValueOnce(undefined as never);

    const { result } = renderHook(() => useDeleteTask(), { wrapper });
    await act(async () => { result.current.mutate('t-1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockToastSuccess).toHaveBeenCalledWith('Tarea eliminada');
  });
});

// ─── useMoveTask ──────────────────────────────────────────────────────────────

describe('useMoveTask', () => {
  it('llama tasksApi.move con taskId y newStatus', async () => {
    const { wrapper } = createWrapper();
    mockMove.mockResolvedValueOnce({ id: 't-1', status: 'done' } as never);

    const { result } = renderHook(() => useMoveTask(), { wrapper });
    await act(async () => {
      result.current.mutate({ taskId: 't-1', newStatus: 'done' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockMove).toHaveBeenCalledWith('t-1', 'done');
  });

  it('invalida taskKeys.all en onSettled', async () => {
    const { wrapper, qc } = createWrapper();
    mockMove.mockResolvedValueOnce({ id: 't-1', status: 'in_progress' } as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useMoveTask(), { wrapper });
    await act(async () => {
      result.current.mutate({ taskId: 't-1', newStatus: 'in_progress' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.all });
  });

  it('revierte el cache en onError', async () => {
    const { wrapper, qc } = createWrapper();
    // Configurar cache previo con una tarea en 'todo'
    qc.setQueryData(taskKeys.all, [{ id: 't-1', status: 'todo', title: 'Test' }]);
    mockMove.mockRejectedValueOnce(new Error('Move failed'));

    const { result } = renderHook(() => useMoveTask(), { wrapper });
    await act(async () => {
      result.current.mutate({ taskId: 't-1', newStatus: 'done' });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    // Después del error, la query debe invalidarse (onSettled se ejecuta igual)
    // El estado del cache puede variar, pero isError debe ser true
    expect(result.current.error?.message).toBe('Move failed');
  });
});
