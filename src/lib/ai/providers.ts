import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AssistantMessage } from '@/lib/groq/assistant';

export interface AIProvider {
  name: string;
  available: boolean;
  chat(systemPrompt: string, messages: AssistantMessage[]): Promise<string>;
}

// ─── Groq provider ───────────────────────────────────────────────────────────

function makeGroqProvider(): AIProvider {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'no-key') {
    return { name: 'groq', available: false, chat: async () => '' };
  }

  const globalForGroq = globalThis as unknown as { groq: Groq };
  const client = globalForGroq.groq ?? new Groq({ apiKey });
  if (process.env.NODE_ENV !== 'production') globalForGroq.groq = client;

  return {
    name: 'groq',
    available: true,
    async chat(systemPrompt, messages) {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.4,
        max_tokens: 1024,
      });
      return completion.choices[0]?.message?.content?.trim() ?? '';
    },
  };
}

// ─── Gemini provider ──────────────────────────────────────────────────────────

function makeGeminiProvider(): AIProvider {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return { name: 'gemini', available: false, chat: async () => '' };
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

  return {
    name: 'gemini',
    available: true,
    async chat(systemPrompt, messages) {
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({
        systemInstruction: systemPrompt,
        history,
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      return result.response.text().trim();
    },
  };
}

// ─── Registry ─────────────────────────────────────────────────────────────────

// Orden de preferencia: los providers se intentan en este orden
// Se puede reordenar según preferencia de velocidad/calidad
let _providers: AIProvider[] | null = null;

export function getProviders(): AIProvider[] {
  if (_providers) return _providers;
  _providers = [makeGroqProvider(), makeGeminiProvider()].filter((p) => p.available);
  if (_providers.length === 0) {
    throw new Error('No hay ningún proveedor de IA configurado. Verificá GROQ_API_KEY o GOOGLE_AI_API_KEY.');
  }
  return _providers;
}
