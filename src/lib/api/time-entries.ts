import { getToken } from '@/lib/firebase/auth';
import { ApiError } from './errors';

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  date: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; avatar: string | null };
}

export interface CreateTimeEntryBody {
  hours: number;
  date?: string;
  note?: string;
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

export const timeEntriesApi = {
  getByTask: (taskId: string) =>
    fetchJsonAuth<TimeEntry[]>(`/api/tasks/${taskId}/time-entries`),

  create: (taskId: string, data: CreateTimeEntryBody) =>
    fetchJsonAuth<TimeEntry>(`/api/tasks/${taskId}/time-entries`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: async (id: string) => {
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`/api/time-entries/${id}`, { method: 'DELETE', headers });
    if (!r.ok) throw new ApiError('Error al eliminar registro de tiempo', r.status);
    return r.json();
  },
};
