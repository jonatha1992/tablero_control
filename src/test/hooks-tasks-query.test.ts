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

    expect(mockGetByBusiness).toHaveBeenCalledWith('biz-1', undefined);
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

    expect(mockGetByBusiness).toHaveBeenCalledWith('all', undefined);
  });

  it('usa getByCreator cuando el usuario no tiene businessId', async () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, businessId: undefined },
      isSuperAdmin: false,
    } as never);
    mockGetByCreator.mockResolvedValueOnce(mockTasks as never);

    const { result } = renderHook(() => useTasksQuery(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetByCreator).toHaveBeenCalledWith('user-1', undefined);
  });

  it('queryKey cambia con filtros distintos (no reutiliza cache)', () => {
    const key1 = taskKeys.byBusiness('biz-1', { status: ['todo'] });
    const key2 = taskKeys.byBusiness('biz-1', { status: ['done'] });
    expect(key1).not.toEqual(key2);
  });

  it('retorna [] ante error sin propagar la excepción', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser, isSuperAdmin: false } as never);
    mockGetByBusiness.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTasksQuery(), { wrapper: createWrapper() });
    // El hook captura el error en el queryFn y retorna [], por lo que isSuccess=true
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
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

    expect(mockGetById).toHaveBeenCalledWith('t-1');
    expect(result.current.data).toMatchObject({ id: 't-1' });
  });
});
