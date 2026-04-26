import type { Task, TaskFilters, TaskStatus } from '@/types/domain/task';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/types/dto/task.dto';
import { getToken } from '@/lib/firebase/auth';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const tasksApi = {
  getByBusiness: (businessId: string, filters?: TaskFilters) => {
    const params = new URLSearchParams({ businessId });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => v != null && params.set(k, String(v)));
    }
    return fetchJson<Task[]>(`/api/tasks?${params}`);
  },

  getByCreator: (userId: string, filters?: TaskFilters) => {
    const params = new URLSearchParams({ creatorId: userId });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => v != null && params.set(k, String(v)));
    }
    return fetchJson<Task[]>(`/api/tasks?${params}`);
  },

  getById: (id: string) => fetchJson<Task>(`/api/tasks/${id}`),

  create: (dto: CreateTaskDTO, creatorId: string, businessId: string) =>
    fetchJsonAuth<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ dto, creatorId, businessId }),
    }),

  update: (id: string, data: UpdateTaskDTO) =>
    fetchJsonAuth<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  move: (taskId: string, newStatus: TaskStatus) =>
    fetchJsonAuth<void>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, _move: true }),
    }),

  delete: async (id: string) => {
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers });
    if (!r.ok) throw new Error('Error al eliminar tarea');
  },

};
