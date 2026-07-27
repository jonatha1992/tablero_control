import { getToken } from '@/lib/firebase/auth';
import type { PlannerImagePayload } from '@/lib/ai/planner-image-contract';
import type { AssistantMessage, AssistantMode } from '@/lib/groq/assistant';
import type { PlannerResponse } from '@/lib/groq/planner-types';
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
  chat: (messages: AssistantMessage[], mode: AssistantMode = 'assistant') =>
    fetchJsonAuth<AssistantResponse>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, mode }),
    }),
  transcribeAudio: async (file: File): Promise<string> => {
    const token = await (await import('@/lib/firebase/auth')).getToken();
    const form = new FormData();
    form.append('audio', file);
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch('/api/assistant/transcribe', { method: 'POST', headers, body: form });
    if (!res.ok) throw new ApiError(await res.text(), res.status);
    const data = await res.json();
    return data.text;
  },
  extractFromText: (text: string) =>
    fetchJsonAuth<{ tasks: import('@/lib/groq/extract-tasks').ExtractedTask[]; parseError: boolean }>('/api/tasks/from-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
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
  planner: (message: string, messages: AssistantMessage[] = [], image?: PlannerImagePayload) =>
    fetchJsonAuth<PlannerResponse>('/api/assistant/planner', {
      method: 'POST',
      body: JSON.stringify({ message, messages, image }),
    }),
};
