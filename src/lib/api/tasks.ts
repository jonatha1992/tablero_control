import type { Task, TaskFilters, TaskStatus } from '@/types/domain/task';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/types/dto/task.dto';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
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

  getById: (id: string) => fetchJson<Task>(`/api/tasks/${id}`),

  create: (dto: CreateTaskDTO, creatorId: string, businessId: string) =>
    fetchJson<Task>('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dto, creatorId, businessId }),
    }),

  update: (id: string, data: UpdateTaskDTO) =>
    fetchJson<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  move: (taskId: string, newStatus: TaskStatus) =>
    fetchJson<void>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, _move: true }),
    }),

  delete: (id: string) =>
    fetch(`/api/tasks/${id}`, { method: 'DELETE' }).then((r) => {
      if (!r.ok) throw new Error('Error al eliminar tarea');
    }),
};
