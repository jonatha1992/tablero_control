import type { Objective } from '@/types/domain/objective';
import type { ObjectiveStatus } from '@/types/domain/objective';
import { getToken } from '@/lib/firebase/auth';
import { ApiError } from './errors';

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

export const objectivesApi = {
  getByBusiness: (businessId: string) =>
    fetchJsonAuth<Objective[]>(`/api/objectives?businessId=${businessId}`),

  getById: (id: string) =>
    fetchJsonAuth<Objective>(`/api/objectives/${id}`),

  create: (data: { name: string; description?: string; color?: string; projectId?: string; targetDate?: string }) =>
    fetchJsonAuth<Objective>('/api/objectives', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; description?: string; color?: string; projectId?: string; targetDate?: string; status: ObjectiveStatus }>) =>
    fetchJsonAuth<Objective>(`/api/objectives/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  complete: (id: string) =>
    fetchJsonAuth<Objective>(`/api/objectives/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ _action: 'complete' }),
    }),

  archive: (id: string) =>
    fetchJsonAuth<Objective>(`/api/objectives/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ _action: 'archive' }),
    }),

  delete: (id: string) =>
    fetchJsonAuth<{ ok: boolean }>(`/api/objectives/${id}`, { method: 'DELETE' }),

  assignTasks: (objectiveId: string, taskIds: string[]) =>
    fetchJsonAuth<void>(`/api/objectives/${objectiveId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    }),

  removeTasks: (objectiveId: string, taskIds: string[]) =>
    fetchJsonAuth<void>(`/api/objectives/${objectiveId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ taskIds, action: 'remove' }),
    }),
};
