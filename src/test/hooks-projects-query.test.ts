import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeleteProject, useProjectsQuery, useUpdateProject } from '@/hooks/queries/use-projects-query';
import { projectsApi } from '@/lib/api/projects';

vi.mock('@/lib/api/projects', () => ({
  projectsApi: {
    getByBusiness: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGetByBusiness = vi.mocked(projectsApi.getByBusiness);
const mockUpdate = vi.mocked(projectsApi.update);
const mockDelete = vi.mocked(projectsApi.delete);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    qc,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useProjectsQuery', () => {
  it('carga proyectos del negocio', async () => {
    const { wrapper } = createWrapper();
    mockGetByBusiness.mockResolvedValueOnce([
      { id: 'proj-1', name: 'Tablero A', businessId: 'biz-1', status: 'active' },
    ] as never);

    const { result } = renderHook(() => useProjectsQuery('biz-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetByBusiness).toHaveBeenCalledWith('biz-1');
  });
});

describe('useUpdateProject', () => {
  it('invalida proyectos y tareas al actualizar proyecto', async () => {
    const { wrapper, qc } = createWrapper();
    mockUpdate.mockResolvedValueOnce({
      id: 'proj-1',
      name: 'Tablero A',
      businessId: 'biz-1',
      status: 'archived',
    } as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateProject(), { wrapper });
    await act(async () => {
      result.current.mutate({
        id: 'proj-1',
        data: { businessId: 'biz-1', status: 'archived' },
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects', 'byBusiness', 'biz-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });
});

describe('useDeleteProject', () => {
  it('invalida proyectos y tareas al eliminar proyecto', async () => {
    const { wrapper, qc } = createWrapper();
    mockDelete.mockResolvedValueOnce({ ok: true } as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteProject(), { wrapper });
    await act(async () => {
      result.current.mutate('proj-1');
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });
});
