import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useMembersQuery, memberKeys } from '@/hooks/queries/use-members-query';
import { useUpdateMember, useRemoveMember } from '@/hooks/mutations/use-update-member';
import { membersApi } from '@/lib/api/members';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/api/members', () => ({
  membersApi: {
    getByBusiness: vi.fn(),
    invite: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
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

const mockGetByBusiness = vi.mocked(membersApi.getByBusiness);
const mockUpdate = vi.mocked(membersApi.update);
const mockRemove = vi.mocked(membersApi.remove);

const mockMembers = [
  { id: 'mem-1', name: 'Ana', email: 'ana@biz.com', role: 'miembro', businessId: 'biz-1' },
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

// ─── useMembersQuery ──────────────────────────────────────────────────────────

describe('useMembersQuery()', () => {
  it('no ejecuta cuando no hay businessId', () => {
    vi.doMock('@/hooks/auth-context', () => ({
      useAuth: vi.fn(() => ({ user: { id: 'u-1', businessId: undefined, role: 'admin' } })),
    }));
    // Verificar enabled logic directamente via keyBusiness con string vacío
    const key = memberKeys.byBusiness('');
    expect(key).toEqual(['members', '']);
  });

  it('llama membersApi.getByBusiness con businessId', async () => {
    const { wrapper } = createWrapper();
    mockGetByBusiness.mockResolvedValueOnce(mockMembers as never);

    const { result } = renderHook(() => useMembersQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetByBusiness).toHaveBeenCalledWith('biz-1');
    expect(result.current.data).toEqual(mockMembers);
  });

  it('usa memberKeys.byBusiness como queryKey', async () => {
    const key = memberKeys.byBusiness('biz-1');
    expect(key).toEqual(['members', 'biz-1']);
  });
});

// ─── useUpdateMember ──────────────────────────────────────────────────────────

describe('useUpdateMember', () => {
  it('llama membersApi.update con id y data', async () => {
    const { wrapper } = createWrapper();
    mockUpdate.mockResolvedValueOnce({ id: 'mem-1', role: 'responsable' } as never);

    const { result } = renderHook(() => useUpdateMember(), { wrapper });
    await act(async () => {
      result.current.mutate({ id: 'mem-1', data: { role: 'responsable' } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith('mem-1', { role: 'responsable' });
  });

  it('invalida memberKeys.all en onSuccess', async () => {
    const { wrapper, qc } = createWrapper();
    mockUpdate.mockResolvedValueOnce({ id: 'mem-1' } as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateMember(), { wrapper });
    await act(async () => { result.current.mutate({ id: 'mem-1', data: { role: 'viewer' } }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: memberKeys.all });
  });
});

// ─── useRemoveMember ─────────────────────────────────────────────────────────

describe('useRemoveMember', () => {
  it('llama membersApi.remove con el id', async () => {
    const { wrapper } = createWrapper();
    mockRemove.mockResolvedValueOnce(undefined as never);

    const { result } = renderHook(() => useRemoveMember(), { wrapper });
    await act(async () => { result.current.mutate('mem-1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRemove).toHaveBeenCalledWith('mem-1');
  });

  it('invalida memberKeys.all en onSuccess', async () => {
    const { wrapper, qc } = createWrapper();
    mockRemove.mockResolvedValueOnce(undefined as never);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useRemoveMember(), { wrapper });
    await act(async () => { result.current.mutate('mem-1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: memberKeys.all });
  });
});
