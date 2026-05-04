import type { Comment } from '@/types/domain/task';
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

export const commentsApi = {
  getByTask: (taskId: string) =>
    fetchJsonAuth<Comment[]>(`/api/tasks/${taskId}/comments`),

  create: (taskId: string, content: string, attachments?: string[]) =>
    fetchJsonAuth<Comment>(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    }),

  delete: async (commentId: string) => {
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Error al eliminar comentario');
  },
};
