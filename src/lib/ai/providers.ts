import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AssistantMessage } from '@/lib/groq/assistant';
import { getGeminiPool, getGroqPool } from '@/lib/ai/pools';
import { GEMINI_TEXT_MODEL, GROQ_TEXT_MODEL } from '@/lib/ai/models';
import { nvidiaAvailable, nvidiaChat } from '@/lib/ai/nvidia';

export interface AIProvider {
  name: string;
  available: boolean;
  chat(systemPrompt: string, messages: AssistantMessage[]): Promise<string>;
}

// ─── Groq provider ───────────────────────────────────────────────────────────

function makeGroqProvider(): AIProvider {
  const pool = getGroqPool();
  if (!pool.available) {
    return { name: 'groq', available: false, chat: async () => '' };
  }

  return {
    name: 'groq',
    available: true,
    async chat(systemPrompt, messages) {
      return pool.run(async (apiKey) => {
        const completion = await new Groq({ apiKey }).chat.completions.create({
          model: GROQ_TEXT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.4,
          max_tokens: 1024,
        });
        return completion.choices[0]?.message?.content?.trim() ?? '';
      });
    },
  };
}

// ─── Gemini provider ──────────────────────────────────────────────────────────

function makeGeminiProvider(): AIProvider {
  const pool = getGeminiPool();
  if (!pool.available) {
    return { name: 'gemini', available: false, chat: async () => '' };
  }

  return {
    name: 'gemini',
    available: true,
    async chat(systemPrompt, messages) {
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }],
      }));

      const lastMessage = messages[messages.length - 1];

      return pool.run(async (apiKey) => {
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
          model: GEMINI_TEXT_MODEL,
        });
        const chat = model.startChat({ systemInstruction: systemPrompt, history });
        const result = await chat.sendMessage(lastMessage.content);
        return result.response.text().trim();
      });
    },
  };
}

// ─── NVIDIA provider ──────────────────────────────────────────────────────────

function makeNvidiaProvider(): AIProvider {
  if (!nvidiaAvailable()) {
    return { name: 'nvidia', available: false, chat: async () => '' };
  }

  return {
    name: 'nvidia',
    available: true,
    async chat(systemPrompt, messages) {
      // La API es OpenAI-compatible pero no tiene `startChat`: el historial se
      // aplana a un solo turno. Para el planner alcanza — el contexto va igual,
      // sólo pierde la separación por roles.
      const transcript = messages
        .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
        .join('\n\n');
      return nvidiaChat(systemPrompt, transcript);
    },
  };
}

// ─── Registry ─────────────────────────────────────────────────────────────────

// Orden de preferencia para TEXTO. Medido contra las APIs reales el 2026-08-06
// con el prompt del planner (JSON, mediana de 3 corridas):
//
//   Groq   llama-3.3-70b-versatile   0.52 s   ← corre en LPU, el más rápido
//   Gemini gemini-flash-lite-latest  0.77 s
//   NVIDIA nemotron-3-nano-30b       2.68 s   ← endpoint compartido, el más lento
//
// Groq va primero porque el planner es interactivo y el usuario espera. NVIDIA
// va último: su valor no es la velocidad sino tener cuota aparte cuando los
// otros dos ya se agotaron.
let _providers: AIProvider[] | null = null;

export function getProviders(): AIProvider[] {
  if (_providers) return _providers;
  _providers = [makeGroqProvider(), makeGeminiProvider(), makeNvidiaProvider()].filter(
    (p) => p.available,
  );
  if (_providers.length === 0) {
    throw new Error(
      'No hay ningún proveedor de IA configurado. Verificá GROQ_API_KEY1..N, ' +
        'GEMINI_API_KEY1..N o NVIDIA_API_KEY.',
    );
  }
  return _providers;
}

/** Companion to `resetAiPools()`: the registry caches availability too. */
export function resetProviders(): void {
  _providers = null;
}
