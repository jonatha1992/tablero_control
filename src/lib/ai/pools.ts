import { collectApiKeys } from '@/lib/ai/api-keys';
import { KeyPool } from '@/lib/ai/key-pool';

/**
 * Shared pools, built once per process.
 *
 * `GOOGLE_AI_API_KEY` and a bare `GROQ_API_KEY` are still read as legacy names
 * so an environment that was configured before the numbered scheme keeps
 * working. Values are deduplicated, so listing the same key under both the old
 * and the new name costs nothing.
 */

let geminiPool: KeyPool | null = null;
let groqPool: KeyPool | null = null;
let nvidiaPool: KeyPool | null = null;

export function getGeminiPool(): KeyPool {
  if (!geminiPool) {
    geminiPool = new KeyPool(
      'gemini',
      collectApiKeys('GEMINI_API_KEY', { extraNames: ['GOOGLE_AI_API_KEY'] }),
    );
  }
  return geminiPool;
}

export function getGroqPool(): KeyPool {
  if (!groqPool) {
    groqPool = new KeyPool('groq', collectApiKeys('GROQ_API_KEY'));
  }
  return groqPool;
}

/**
 * NVIDIA hoy es una sola key, así que el pool no rota nada. Igual pasa por acá:
 * hereda el cooldown por clase de error y el tope de presupuesto, y el día que
 * haya una segunda key no hay que tocar los call sites.
 */
export function getNvidiaPool(): KeyPool {
  if (!nvidiaPool) {
    nvidiaPool = new KeyPool('nvidia', collectApiKeys('NVIDIA_API_KEY'));
  }
  return nvidiaPool;
}

/** Tests build environments per case; pools must not outlive them. */
export function resetAiPools(): void {
  geminiPool = null;
  groqPool = null;
  nvidiaPool = null;
}
