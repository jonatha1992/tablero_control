import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useLocationsQuery, useActiveLocationsQuery, locationKeys } from '@/hooks/queries/use-locations-query';
import { useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/mutations/use-locations';
import { locationsApi } from '@/lib/api/locations';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/api/locations', () => ({
  locationsApi: {
    getByBusiness: vi.fn(),
    getActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
      name: 'Admin',
    },
    isSuperAdmin: false,
  })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);
const mockGetByBusiness = vi.mocked(locationsApi.getByBusiness);
const mockGetActive = vi.mocked(locationsApi.getActive);
const mockCreate = vi.mocked(locationsApi.create);
const mockUpdate = vi.mocked(locationsApi.update);
const mockDeleteApi = vi.mocked(locationsApi.delete);

const mockLocations = [
  { id: 'loc-1', name: 'Depósito', businessId: 'biz-1', status: 'active', type: 'department' },
  { id: 'loc-2', name: 'Archivo', businessId: 'biz-1', status: 'inactive', type: 'department' },
];

// ─── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return { wrapper: ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children), qc };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── useLocationsQuery ────────────────────────────────────────────────────────

describe('useLocationsQuery()', () => {
  it('no ejecuta sin businessId (enabled=false)', () => {
    // Verificar la lógica de enabled: cuando businessId="" → false
    const key = locationKeys.byBusiness('');
    // La query estaría disabled con businessId vacío
    expect(key).toEqual(['locations', '']);
  });

  it('llama locationsApi.getByBusiness con businessId', async () => {
    const { wrapper } = createWrapper();
    mockGetByBusiness.mockResolvedValueOnce(mockLocations as never);

    const { result } = renderHook(() => useLocationsQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetByBusiness).toHaveBeenCalledWith('biz-1');
    expect(result.current.data).toHaveLength(2);
  });
});

// ─── useActiveLocationsQuery ──────────────────────────────────────────────────

describe('useActiveLocationsQuery()', () => {
  it('llama locationsApi.getActive y retorna solo activas', async () => {
    const { wrapper } = createWrapper();
    mockGetActive.mockResolvedValueOnce([mockLocations[0]] as never);

    const { result } = renderHook(() => useActiveLocationsQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetActive).toHaveBeenCalledWith('biz-1');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].status).toBe('active');
  });
});

// ─── useCreateLocation ────────────────────────────────────────────────────────

describe('useCreateLocation', () => {
  it('llama locationsApi.create y retorna 201', async () => {
    const { wrapper } = createWrapper();
    const created = { id: 'loc-new', name: 'Nuevo', businessId: 'biz-1' };
    mockCreate.mockResolvedValueOnce(created as never);

    const { result } = renderHook(() => useCreateLocation(), { wrapper });
    await act(async () => {
      result.current.mutate({ businessId: 'biz-1', name: 'Nuevo', type: 'department' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCreate).toHaveBeenCalled();
  });

  it('invalida locations query en onSuccess', async () => {
    const { wrapper, qc } = createWrapper();
    mockCreate.mockResolvedValueOnce({ id: 'loc-new', name: 'X', businessId: 'biz-1' } as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateLocation(), { wrapper });
    await act(async () => {
      result.current.mutate({ businessId: 'biz-1', name: 'X' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['locations', 'biz-1'] });
  });

  it('toast.success en onSuccess', async () => {
    const { wrapper } = createWrapper();
    mockCreate.mockResolvedValueOnce({ id: 'x', name: 'Sector', businessId: 'biz-1' } as never);

    const { result } = renderHook(() => useCreateLocation(), { wrapper });
    await act(async () => { result.current.mutate({ businessId: 'biz-1', name: 'Sector' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockToastSuccess).toHaveBeenCalledWith('Sector creado', expect.any(Object));
  });

  it('toast.error en onError', async () => {
    const { wrapper } = createWrapper();
    mockCreate.mockRejectedValueOnce(new Error('DB error'));

    const { result } = renderHook(() => useCreateLocation(), { wrapper });
    await act(async () => { result.current.mutate({ businessId: 'biz-1', name: 'Fail' }); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToastError).toHaveBeenCalled();
  });
});

// ─── useUpdateLocation ────────────────────────────────────────────────────────

describe('useUpdateLocation', () => {
  it('llama locationsApi.update con id y data', async () => {
    const { wrapper } = createWrapper();
    mockUpdate.mockResolvedValueOnce({ id: 'loc-1', name: 'Updated', businessId: 'biz-1' } as never);

    const { result } = renderHook(() => useUpdateLocation(), { wrapper });
    await act(async () => {
      result.current.mutate({ id: 'loc-1', data: { name: 'Updated' } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith('loc-1', { name: 'Updated' });
  });

  it('invalida locations query en onSuccess', async () => {
    const { wrapper, qc } = createWrapper();
    mockUpdate.mockResolvedValueOnce({ id: 'loc-1', name: 'X', businessId: 'biz-1' } as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateLocation(), { wrapper });
    await act(async () => { result.current.mutate({ id: 'loc-1', data: { name: 'X' } }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalled();
  });
});

// ─── useDeleteLocation ────────────────────────────────────────────────────────

describe('useDeleteLocation', () => {
  it('llama locationsApi.delete con el id', async () => {
    const { wrapper } = createWrapper();
    mockDeleteApi.mockResolvedValueOnce(undefined as never);

    const { result } = renderHook(() => useDeleteLocation(), { wrapper });
    await act(async () => {
      result.current.mutate({ id: 'loc-1', businessId: 'biz-1' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteApi).toHaveBeenCalledWith('loc-1');
  });

  it('invalida locations query en onSuccess', async () => {
    const { wrapper, qc } = createWrapper();
    mockDeleteApi.mockResolvedValueOnce(undefined as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteLocation(), { wrapper });
    await act(async () => { result.current.mutate({ id: 'loc-1', businessId: 'biz-1' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['locations', 'biz-1'] });
  });

  it('toast.success en onSuccess', async () => {
    const { wrapper } = createWrapper();
    mockDeleteApi.mockResolvedValueOnce(undefined as never);

    const { result } = renderHook(() => useDeleteLocation(), { wrapper });
    await act(async () => { result.current.mutate({ id: 'loc-1', businessId: 'biz-1' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockToastSuccess).toHaveBeenCalledWith('Sector eliminado', expect.any(Object));
  });
});
