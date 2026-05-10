import { getToken } from '@/lib/firebase/auth';
import type { AssistantMessage } from '@/lib/groq/assistant';
import { ApiError } from './errors';

interface AssistantResponse {
  message: string;
}

export interface GeneratePlanResponse {
  type: 'cycle' | 'objective';
  name: string;
  id: string;
  tasksCreated: number;
  taskTitles: string[];
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

export const assistantApi = {
  chat: (messages: AssistantMessage[]) =>
    fetchJsonAuth<AssistantResponse>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),
  generatePlan: (type: 'cycle' | 'objective', description: string) =>
    fetchJsonAuth<GeneratePlanResponse>('/api/assistant/generate-plan', {
      method: 'POST',
      body: JSON.stringify({ type, description }),
    }),
  previewPlan: (type: 'cycle' | 'objective', description: string) =>
    fetchJsonAuth<{ type: 'cycle' | 'objective'; description: string; plan: import('@/lib/groq/generate-plan').GeneratedPlan }>('/api/assistant/preview-plan', {
      method: 'POST',
      body: JSON.stringify({ type, description }),
    }),
};
