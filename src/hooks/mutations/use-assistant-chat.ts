'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { assistantApi } from '@/lib/api/assistant';
import type { AssistantMessage, AssistantMode } from '@/lib/groq/assistant';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { GeneratedPlan } from '@/lib/groq/generate-plan';
import type { GeneratePlanResponse } from '@/lib/api/assistant';
import type { PlannerResponse } from '@/lib/groq/planner-types';

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

export interface ClarifyMessage {
  role: 'clarify';
  question: string;
  options?: string[];
  field: string;
}

export type DisplayMessage =
  | AssistantMessage
  | ActionMessage
  | TasksMessage
  | PreviewMessage
  | ClarifyMessage;

function toTextMessages(messages: DisplayMessage[]): AssistantMessage[] {
  return messages
    .filter((m): m is AssistantMessage => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
}

export function useAssistantChat(mode: AssistantMode = 'assistant') {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [pendingSlots, setPendingSlots] = useState<Record<string, string>>({});

  const chatMutation = useMutation({
    mutationFn: (msgs: AssistantMessage[]) => assistantApi.chat(msgs, mode),
  });

  const plannerMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: AssistantMessage[] }) =>
      assistantApi.planner(message, history),
  });

  const applyPlannerResponse = (response: PlannerResponse) => {
    switch (response.type) {
      case 'message':
        setMessages((prev) => [...prev, { role: 'assistant', content: response.content }]);
        break;
      case 'clarify':
        setMessages((prev) => [
          ...prev,
          {
            role: 'clarify',
            question: response.question,
            options: response.options,
            field: response.field,
          },
        ]);
        break;
      case 'preview_tasks':
        setMessages((prev) => [
          ...prev,
          {
            role: 'tasks',
            tasks: response.tasks,
            parseError: response.parseError,
            confirmed: false,
          },
        ]);
        break;
      case 'preview_plan':
        setMessages((prev) => [
          ...prev,
          {
            role: 'preview',
            type: response.planType,
            description: response.description,
            plan: response.plan,
            state: 'pending',
          },
        ]);
        break;
    }
  };

  const send = async (userText: string) => {
    const userMsg: AssistantMessage = { role: 'user', content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    const textOnly = toTextMessages(nextMessages);

    try {
      const result = await chatMutation.mutateAsync(textOnly);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, ocurrió un error. Intentá de nuevo.' },
      ]);
    }
  };

  const sendPlanner = async (userText: string) => {
    const userMsg: AssistantMessage = { role: 'user', content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    const history = toTextMessages(nextMessages.slice(0, -1));

    try {
      const result = await plannerMutation.mutateAsync({ message: userText, history });
      applyPlannerResponse(result);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'No pude procesar tu solicitud. Intentá de nuevo.' },
      ]);
    }
  };

  const answerClarify = (field: string, answer: string) => {
    setPendingSlots((prev) => ({ ...prev, [field]: answer }));
    void sendPlanner(answer);
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
      prev.map((m, i) => (i === msgIdx && m.role === 'preview' ? { ...m, state: 'confirmed' } : m)),
    );
  };

  const cancelPreview = (msgIdx: number) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIdx && m.role === 'preview' ? { ...m, state: 'cancelled' } : m)),
    );
  };

  const replacePreviewWithAction = (msgIdx: number, result: GeneratePlanResponse) => {
    const link = result.type === 'cycle' ? '/dashboard/planificacion' : '/dashboard/planificacion/objetivos';
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIdx ? ({ role: 'action', action: { ...result, link } } as ActionMessage) : m,
      ),
    );
  };

  const addTaskPreview = (tasks: ExtractedTask[], parseError: boolean) => {
    setMessages((prev) => [...prev, { role: 'tasks', tasks, parseError, confirmed: false }]);
  };

  const confirmTaskMessage = (msgIdx: number) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIdx && m.role === 'tasks' ? { ...m, confirmed: true } : m)),
    );
  };

  const updateTaskInMessage = (msgIdx: number, taskIdx: number, updated: ExtractedTask) => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIdx || m.role !== 'tasks') return m;
        return { ...m, tasks: m.tasks.map((t, ti) => (ti === taskIdx ? updated : t)) };
      }),
    );
  };

  const removeTaskFromMessage = (msgIdx: number, taskIdx: number) => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIdx || m.role !== 'tasks') return m;
        return { ...m, tasks: m.tasks.filter((_, ti) => ti !== taskIdx) };
      }),
    );
  };

  const clear = () => {
    setMessages([]);
    setPendingSlots({});
  };

  return {
    messages,
    pendingSlots,
    send,
    sendPlanner,
    answerClarify,
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
    isPending: chatMutation.isPending || plannerMutation.isPending,
  };
}
