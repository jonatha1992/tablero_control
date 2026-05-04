import { getToken } from '@/lib/firebase/auth';

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
  if (!res.ok) throw new Error(await res.text());
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
    if (!r.ok) throw new Error('Error al eliminar registro de tiempo');
    return r.json();
  },
};
