import { getToken } from '@/lib/firebase/auth';
import type { AssistantMessage } from '@/lib/groq/assistant';

interface AssistantResponse {
  message: string;
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

export const assistantApi = {
  chat: (messages: AssistantMessage[]) =>
    fetchJsonAuth<AssistantResponse>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),
};
