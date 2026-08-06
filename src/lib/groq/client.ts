import Groq from 'groq-sdk';
import { getGroqPool } from '@/lib/ai/pools';

/**
 * Groq client with key rotation behind an unchanged surface.
 *
 * The exported `groq` keeps the exact shape callers already use
 * (`groq.chat.completions.create`, `groq.audio.transcriptions.create`), so the
 * six call sites and the test mocks stay untouched. What changed is underneath:
 * every call now runs through the key pool, so a 429 on one key rotates to the
 * next instead of failing the request.
 *
 * Groq applies rate limits per organization rather than per key, so this only
 * buys real quota because the configured keys belong to separate accounts.
 *
 * Not supported through this facade: streaming responses. Rotation has to see
 * the call succeed or fail to decide whether to try another key, and a stream
 * only reveals that after the caller starts reading. No call site streams
 * today; one that needs to should build its own client from
 * `getGroqPool().keys`.
 */

const clients = new Map<string, Groq>();

function clientFor(apiKey: string): Groq {
  const existing = clients.get(apiKey);
  if (existing) return existing;
  const client = new Groq({ apiKey });
  clients.set(apiKey, client);
  return client;
}

function rotate<T>(call: (client: Groq) => Promise<T>): Promise<T> {
  return getGroqPool().run((apiKey) => call(clientFor(apiKey)));
}

type ChatCreate = Groq['chat']['completions']['create'];
type TranscriptionCreate = Groq['audio']['transcriptions']['create'];

export const groq = {
  chat: {
    completions: {
      create: ((...args: Parameters<ChatCreate>) =>
        rotate((client) => client.chat.completions.create(...args) as Promise<unknown>)) as ChatCreate,
    },
  },
  audio: {
    transcriptions: {
      create: ((...args: Parameters<TranscriptionCreate>) =>
        rotate((client) =>
          client.audio.transcriptions.create(...args) as Promise<unknown>,
        )) as TranscriptionCreate,
    },
  },
};

if (!getGroqPool().available) {
  console.warn(
    'No hay keys de Groq configuradas (GROQ_API_KEY1..N). La transcripción de audio no funcionará.',
  );
}
