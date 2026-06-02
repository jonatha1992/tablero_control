import type { Task, TaskFilters, TaskStatus } from '@/types/domain/task';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/types/dto/task.dto';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import { getToken } from '@/lib/firebase/auth';
import { ApiError } from './errors';

interface FromAudioResponse {
  transcription: string;
  tasks: ExtractedTask[];
  parseError: boolean;
}

interface FromTextResponse {
  tasks: ExtractedTask[];
  parseError: boolean;
}

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

function serializeFilterValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join(',');
  return String(value);
}

export const tasksApi = {
  getByBusiness: (businessId: string, signal?: AbortSignal, filters?: TaskFilters) => {
    const params = new URLSearchParams({ businessId });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v == null) return;
        params.set(k, serializeFilterValue(v));
      });
    }
    return fetchJsonAuth<Task[]>(`/api/tasks?${params}`, { signal });
  },

  getByCreator: (userId: string, signal?: AbortSignal, filters?: TaskFilters) => {
    const params = new URLSearchParams({ creatorId: userId });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v == null) return;
        params.set(k, serializeFilterValue(v));
      });
    }
    return fetchJsonAuth<Task[]>(`/api/tasks?${params}`, { signal });
  },

  getById: (id: string, signal?: AbortSignal) =>
    fetchJsonAuth<Task>(`/api/tasks/${id}`, { signal }),

  create: (dto: CreateTaskDTO, creatorId: string, businessId: string) =>
    fetchJsonAuth<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ dto, creatorId, businessId }),
    }),

  replicate: (body: {
    projectIds?: string[];
    locationIds?: string[];
    template?: CreateTaskDTO;
    sourceTaskId?: string;
  }) =>
    fetchJsonAuth<{ tasks: Task[]; count: number }>('/api/tasks/replicate', {
      method: 'POST',
      body: JSON.stringify(body),
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
    if (!r.ok) {
      let message = 'Error al eliminar tarea';
      try {
        const text = await r.text();
        try {
          const parsed = JSON.parse(text) as { error?: string; reason?: string; detail?: string };
          const error = parsed.error ?? text;
          const reason = parsed.reason ? ` (reason: ${parsed.reason})` : '';
          const detail = parsed.detail ? ` — ${parsed.detail}` : '';
          message = `${error}${reason}${detail}`;
        } catch {
          message = text || message;
        }
      } catch {
        // ignore and keep default
      }
      throw new ApiError(message, r.status);
    }
  },

  fromAudio: async (audioFile: File, token: string): Promise<FromAudioResponse> => {
    const fd = new FormData();
    fd.append('audio', audioFile);
    const res = await fetch('/api/tasks/from-audio', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) throw new ApiError(await res.text(), res.status);
    return res.json() as Promise<FromAudioResponse>;
  },

  fromText: (text: string) =>
    fetchJsonAuth<FromTextResponse>('/api/tasks/from-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};
