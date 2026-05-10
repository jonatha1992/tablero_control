'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { assistantApi } from '@/lib/api/assistant';
import type { GeneratePlanResponse } from '@/lib/api/assistant';
import type { AssistantMessage } from '@/lib/groq/assistant';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { GeneratedPlan } from '@/lib/groq/generate-plan';

export interface ActionMessage {
  role: 'action';
  action: GeneratePlanResponse & { link: string };
}

export interface TasksMessage {
  role: 'tasks';
  tasks: ExtractedTask[];
  parseError: boolean;
  confirmed: boolean;
}

export interface PreviewMessage {
  role: 'preview';
  type: 'cycle' | 'objective';
  description: string;
  plan: GeneratedPlan;
  state: 'pending' | 'confirmed' | 'cancelled';
}

export type DisplayMessage = AssistantMessage | ActionMessage | TasksMessage | PreviewMessage;

export function useAssistantChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);

  const mutation = useMutation({
    mutationFn: (msgs: AssistantMessage[]) => assistantApi.chat(msgs),
  });

  const send = async (userText: string) => {
    const userMsg: AssistantMessage = { role: 'user', content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    const textOnly = nextMessages.filter(
      (m): m is AssistantMessage => m.role !== 'action' && m.role !== 'tasks' && m.role !== 'preview'
    );

    try {
      const result = await mutation.mutateAsync(textOnly);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, ocurrió un error. Intentá de nuevo.' },
      ]);
    }
  };

  const addAction = (result: GeneratePlanResponse) => {
    const link = result.type === 'cycle' ? '/dashboard/planificacion' : '/dashboard/planificacion/objetivos';
    setMessages((prev) => [...prev, { role: 'action', action: { ...result, link } }]);
  };

  const addPreview = (type: 'cycle' | 'objective', description: string, plan: GeneratedPlan) => {
    setMessages((prev) => [...prev, { role: 'preview', type, description, plan, state: 'pending' }]);
  };

  const confirmPreview = (msgIdx: number) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIdx && m.role === 'preview' ? { ...m, state: 'confirmed' } : m))
    );
  };

  const cancelPreview = (msgIdx: number) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIdx && m.role === 'preview' ? { ...m, state: 'cancelled' } : m))
    );
  };

  const replacePreviewWithAction = (msgIdx: number, result: GeneratePlanResponse) => {
    const link = result.type === 'cycle' ? '/dashboard/planificacion' : '/dashboard/planificacion/objetivos';
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIdx ? ({ role: 'action', action: { ...result, link } } as ActionMessage) : m
      )
    );
  };

  const addTaskPreview = (tasks: ExtractedTask[], parseError: boolean) => {
    setMessages((prev) => [...prev, { role: 'tasks', tasks, parseError, confirmed: false }]);
  };

  const confirmTaskMessage = (msgIdx: number) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIdx && m.role === 'tasks' ? { ...m, confirmed: true } : m))
    );
  };

  const updateTaskInMessage = (msgIdx: number, taskIdx: number, updated: ExtractedTask) => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIdx || m.role !== 'tasks') return m;
        return { ...m, tasks: m.tasks.map((t, ti) => (ti === taskIdx ? updated : t)) };
      })
    );
  };

  const removeTaskFromMessage = (msgIdx: number, taskIdx: number) => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIdx || m.role !== 'tasks') return m;
        return { ...m, tasks: m.tasks.filter((_, ti) => ti !== taskIdx) };
      })
    );
  };

  const clear = () => setMessages([]);

  return {
    messages,
    send,
    addAction,
    addPreview,
    confirmPreview,
    cancelPreview,
    replacePreviewWithAction,
    addTaskPreview,
    confirmTaskMessage,
    updateTaskInMessage,
    removeTaskFromMessage,
    clear,
    isPending: mutation.isPending,
  };
}
