import type { Task, TaskFilters, TaskStatus } from '@/types/domain/task';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/types/dto/task.dto';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';

interface FromAudioResponse {
  transcription: string;
  tasks: ExtractedTask[];
  parseError: boolean;
}

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

  getByCreator: (userId: string, filters?: TaskFilters) => {
    const params = new URLSearchParams({ creatorId: userId });
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

  fromAudio: async (audioFile: File, token: string): Promise<FromAudioResponse> => {
    const fd = new FormData();
    fd.append('audio', audioFile);
    const res = await fetch('/api/tasks/from-audio', {
      method: 'POST',
      // No Content-Type header — browser sets it automatically with the multipart boundary
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<FromAudioResponse>;
  },
};
