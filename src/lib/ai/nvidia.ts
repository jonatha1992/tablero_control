import { getNvidiaPool } from '@/lib/ai/pools';
import { NVIDIA_TEXT_MODEL, NVIDIA_VISION_MODEL } from '@/lib/ai/models';

/**
 * NVIDIA NIM (build.nvidia.com) — último eslabón de la cadena de IA.
 *
 * Por qué está acá y no es redundante con Groq: **GroqCloud no ofrece ningún
 * modelo con entrada de imagen** (verificado el 2026-08-06 contra /v1/models:
 * 15 modelos, ninguno de visión). Así que cuando Gemini se queda sin cuota, sin
 * NVIDIA la lectura de imágenes del planner no tiene fallback y muere.
 *
 * Se reparten así, por capacidad y no por preferencia:
 *   - texto  → Gemini, Groq, NVIDIA
 *   - imagen → Gemini, NVIDIA        (Groq no puede)
 *   - audio  → Gemini, Groq Whisper  (NVIDIA no procesa audio)
 *
 * La API es compatible con OpenAI, así que alcanza `fetch` sin SDK nuevo.
 */

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

/** Tope por request. El presupuesto total de la cadena lo pone el llamador. */
const REQUEST_TIMEOUT_MS = Number(process.env.NVIDIA_REQUEST_TIMEOUT_MS ?? 30_000);

interface NvidiaTextPart {
  type: 'text';
  text: string;
}

interface NvidiaImagePart {
  type: 'image_url';
  image_url: { url: string };
}

type NvidiaContent = string | Array<NvidiaTextPart | NvidiaImagePart>;

interface NvidiaMessage {
  role: 'system' | 'user' | 'assistant';
  content: NvidiaContent;
}

interface NvidiaChoice {
  message?: { content?: string };
}

interface NvidiaResponse {
  choices?: NvidiaChoice[];
}

/**
 * Error con `status`, para que `classifyFailure()` del pool pueda decidir si
 * conviene rotar de key o si es un fallo nuestro que hay que propagar.
 */
export class NvidiaError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'NvidiaError';
  }
}

async function callNvidia(
  apiKey: string,
  model: string,
  messages: NvidiaMessage[],
  maxTokens: number,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Un timeout o un socket cortado se tratan como saturación: vale rotar.
    throw new NvidiaError(
      err instanceof Error ? err.message : 'NVIDIA request failed',
      503,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new NvidiaError(
      `NVIDIA HTTP ${response.status}: ${body.slice(0, 200)}`,
      response.status,
    );
  }

  const data = (await response.json()) as NvidiaResponse;
  const content = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!content) {
    // Respuesta vacía no es un problema de cuota: rotar de key daría lo mismo.
    throw new NvidiaError('NVIDIA devolvió una respuesta vacía.', 422);
  }
  return content;
}

export function nvidiaAvailable(): boolean {
  return getNvidiaPool().available;
}

/** Texto plano. Último recurso después de Gemini y Groq. */
export async function nvidiaChat(
  systemPrompt: string,
  userPrompt: string,
  options: { deadline?: number; maxTokens?: number } = {},
): Promise<string> {
  const { deadline, maxTokens = 1024 } = options;
  return getNvidiaPool().run(
    (apiKey) =>
      callNvidia(
        apiKey,
        NVIDIA_TEXT_MODEL,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens,
      ),
    { deadline },
  );
}

/** Lectura de imagen. El único fallback real de Gemini para esto. */
export async function nvidiaVision(
  prompt: string,
  image: { mimeType: string; base64: string },
  options: { deadline?: number; maxTokens?: number } = {},
): Promise<string> {
  const { deadline, maxTokens = 1500 } = options;
  return getNvidiaPool().run(
    (apiKey) =>
      callNvidia(
        apiKey,
        NVIDIA_VISION_MODEL,
        [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
              },
            ],
          },
        ],
        maxTokens,
      ),
    { deadline },
  );
}
