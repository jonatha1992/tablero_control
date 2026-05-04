import type { Cycle } from '@/types/domain/cycle';
import type { CycleStatus } from '@/types/domain/cycle';
import { getToken } from '@/lib/firebase/auth';

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const cyclesApi = {
  getByBusiness: (businessId: string) =>
    fetchJsonAuth<Cycle[]>(`/api/cycles?businessId=${businessId}`),

  getById: (id: string) =>
    fetchJsonAuth<Cycle>(`/api/cycles/${id}`),

  create: (data: { name: string; goal?: string; teamId?: string; startDate: string; endDate: string }) =>
    fetchJsonAuth<Cycle>('/api/cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; goal?: string; teamId?: string; status: CycleStatus; startDate: string; endDate: string }>) =>
    fetchJsonAuth<Cycle>(`/api/cycles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  start: (id: string) =>
    fetchJsonAuth<Cycle>(`/api/cycles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ _action: 'start' }),
    }),

  complete: (id: string) =>
    fetchJsonAuth<Cycle>(`/api/cycles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ _action: 'complete' }),
    }),

  close: (id: string) =>
    fetchJsonAuth<Cycle>(`/api/cycles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ _action: 'close' }),
    }),

  delete: async (id: string) => {
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/cycles/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Error al eliminar período');
  },

  assignTasks: (cycleId: string, taskIds: string[]) =>
    fetchJsonAuth<void>(`/api/cycles/${cycleId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    }),

  removeTasks: (cycleId: string, taskIds: string[]) =>
    fetchJsonAuth<void>(`/api/cycles/${cycleId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ taskIds, action: 'remove' }),
    }),
};
