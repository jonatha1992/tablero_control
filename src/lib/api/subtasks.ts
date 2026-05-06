import type { Task } from '@/types/domain/task';
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

export const subtasksApi = {
  getByTask: (taskId: string) =>
    fetchJsonAuth<Task[]>(`/api/tasks/${taskId}/subtasks`),

  create: (taskId: string, title: string) =>
    fetchJsonAuth<Task>(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
};
