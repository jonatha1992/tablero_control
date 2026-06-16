import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useTasksQuery, useTaskQuery, taskKeys } from '@/hooks/queries/use-tasks-query';
import { tasksApi } from '@/lib/api/tasks';

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
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/auth-context';
const mockUseAuth = vi.mocked(useAuth);
const mockGetByBusiness = vi.mocked(tasksApi.getByBusiness);
const mockGetByCreator = vi.mocked(tasksApi.getByCreator);
const mockGetById = vi.mocked(tasksApi.getById);

// ─── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

const mockUser = {
  id: 'user-1',
  role: 'admin' as const,
  businessId: 'biz-1',
  email: 'a@b.com',
  name: 'Test',
};

const mockTasks = [
  { id: 't-1', title: 'Tarea 1', status: 'todo', businessId: 'biz-1' },
  { id: 't-2', title: 'Tarea 2', status: 'done', businessId: 'biz-1' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── useTasksQuery ────────────────────────────────────────────────────────────

describe('useTasksQuery()', () => {
  it('no ejecuta si user=null (enabled=false)', () => {
    mockUseAuth.mockReturnValue({ user: null, isSuperAdmin: false } as never);
    const { result } = renderHook(() => useTasksQuery(), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetByBusiness).not.toHaveBeenCalled();
  });

  it('llama getByBusiness con businessId del usuario', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser, isSuperAdmin: false } as never);
    mockGetByBusiness.mockResolvedValueOnce(mockTasks as never);

    const { result } = renderHook(() => useTasksQuery(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetByBusiness).toHaveBeenCalledWith('biz-1', expect.any(AbortSignal));
    expect(result.current.data).toHaveLength(2);
  });

  it('usa "all" como businessId para superadmin', async () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'superadmin', businessId: undefined },
      isSuperAdmin: true,
    } as never);
    mockGetByBusiness.mockResolvedValueOnce([] as never);

    const { result } = renderHook(() => useTasksQuery(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetByBusiness).toHaveBeenCalledWith('all', expect.any(AbortSignal));
  });

  it('usa getByCreator cuando el usuario no tiene businessId', async () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, businessId: undefined },
      isSuperAdmin: false,
    } as never);
    mockGetByCreator.mockResolvedValueOnce(mockTasks as never);

    const { result } = renderHook(() => useTasksQuery(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetByCreator).toHaveBeenCalledWith('user-1', expect.any(AbortSignal));
  });

  it('queryKey cambia con filtros distintos (no reutiliza cache)', () => {
    const key1 = taskKeys.byBusiness('biz-1', { status: ['todo'] });
    const key2 = taskKeys.byBusiness('biz-1', { status: ['done'] });
    expect(key1).not.toEqual(key2);
  });

  it('re-lanza AbortError (cancelación) sin loguear ni devolver []', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser, isSuperAdmin: false } as never);
    const abortErr = new DOMException('signal is aborted without reason', 'AbortError');
    mockGetByBusiness.mockRejectedValueOnce(abortErr);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useTasksQuery(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError || result.current.isFetching === false).toBe(true));

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('propaga el error a React Query (isError=true) cuando la API falla', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser, isSuperAdmin: false } as never);
    mockGetByBusiness.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTasksQuery(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('pasa el AbortSignal de React Query al API (cancelación sin crash)', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser, isSuperAdmin: false } as never);
    mockGetByBusiness.mockImplementation(
      (_businessId, abortSignal) =>
        new Promise((resolve, reject) => {
          if (abortSignal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          abortSignal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
          setTimeout(() => resolve(mockTasks as never), 50);
        }),
    );

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children);

    const { unmount } = renderHook(() => useTasksQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetByBusiness).toHaveBeenCalled());
    const passedSignal = mockGetByBusiness.mock.calls[0]?.[1] as AbortSignal;
    expect(passedSignal).toBeInstanceOf(AbortSignal);

    unmount();
    await waitFor(() => expect(passedSignal.aborted).toBe(true));
  });

  it('pasa el AbortSignal de React Query al API (cancelación sin crash)', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser, isSuperAdmin: false } as never);
    mockGetByBusiness.mockImplementation(
      (_businessId, abortSignal) =>
        new Promise((resolve, reject) => {
          if (abortSignal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          abortSignal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
          setTimeout(() => resolve(mockTasks as never), 50);
        }),
    );

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children);

    const { unmount } = renderHook(() => useTasksQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetByBusiness).toHaveBeenCalled());
    const passedSignal = mockGetByBusiness.mock.calls[0]?.[1] as AbortSignal;
    expect(passedSignal).toBeInstanceOf(AbortSignal);

    unmount();
    await waitFor(() => expect(passedSignal.aborted).toBe(true));
  });
});

// ─── useTaskQuery ─────────────────────────────────────────────────────────────

describe('useTaskQuery()', () => {
  it('no ejecuta si id está vacío', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, isSuperAdmin: false } as never);
    const { result } = renderHook(() => useTaskQuery(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetById).not.toHaveBeenCalled();
  });

  it('ejecuta y retorna la tarea si id es válido', async () => {
    const task = { id: 't-1', title: 'Detalle', status: 'todo' };
    mockGetById.mockResolvedValueOnce(task as never);

    const { result } = renderHook(() => useTaskQuery('t-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetById).toHaveBeenCalledWith('t-1', expect.any(AbortSignal));
    expect(result.current.data).toMatchObject({ id: 't-1' });
  });
});
