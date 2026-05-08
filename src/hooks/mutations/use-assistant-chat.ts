'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { assistantApi } from '@/lib/api/assistant';
import type { AssistantMessage } from '@/lib/groq/assistant';

export function useAssistantChat() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);

  const mutation = useMutation({
    mutationFn: (msgs: AssistantMessage[]) => assistantApi.chat(msgs),
  });

  const send = async (userText: string) => {
    const userMsg: AssistantMessage = { role: 'user', content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    try {
      const result = await mutation.mutateAsync(nextMessages);
      const assistantMsg: AssistantMessage = { role: 'assistant', content: result.message };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, ocurrió un error. Intentá de nuevo.' },
      ]);
    }
  };

  const clear = () => setMessages([]);

  return { messages, send, clear, isPending: mutation.isPending };
}
