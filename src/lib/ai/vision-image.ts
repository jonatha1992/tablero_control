import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PlannerImagePayload } from '@/lib/ai/planner-image-contract';
import { getGeminiPool } from '@/lib/ai/pools';
import { GEMINI_VISION_MODEL } from '@/lib/ai/models';
import { nvidiaAvailable, nvidiaVision } from '@/lib/ai/nvidia';

/**
 * Presupuesto total de la lectura de imagen, para toda la cadena junta.
 *
 * Sin este tope, 7 keys de Gemini que timeoutean más el intento de NVIDIA suman
 * una espera que el usuario lee como app colgada. Con el tope, la degradación es
 * visible y acotada.
 */
const VISION_TOTAL_BUDGET_MS = Number(process.env.AI_VISION_TOTAL_BUDGET_MS ?? 60_000);

export interface PlannerImageReadResult {
  visionText: string;
  summary: string;
}

export type PlannerVisionErrorCode = 'missing_google_ai_key' | 'vision_read_failed';

export class PlannerVisionError extends Error {
  constructor(
    public readonly code: PlannerVisionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PlannerVisionError';
  }
}

const VISION_PROMPT = `Leé la imagen para el planificador de Tablero de Control.

Objetivo:
- Si la imagen contiene agenda, fechas, horarios, exámenes, reuniones o eventos, extraé TODO en texto claro en español.
- Incluí título, fecha, hora, modalidad, sede/aula/link/ubicación y cualquier nota útil.
- Si la fecha no tiene año visible, mantené día y mes tal como aparecen.
- Si no es una agenda, describí brevemente el contenido para poder responder preguntas del usuario.

Respondé solo texto plano, sin Markdown.`;

export async function readImageForPlanner(
  image: PlannerImagePayload,
): Promise<PlannerImageReadResult> {
  const pool = getGeminiPool();
  if (!pool.available && !nvidiaAvailable()) {
    throw new PlannerVisionError(
      'missing_google_ai_key',
      'GOOGLE_AI_API_KEY is required to read planner images.',
    );
  }

  const deadline = Date.now() + VISION_TOTAL_BUDGET_MS;

  // Gemini primero: es el más preciso leyendo agendas y el único multimodal
  // nativo de la cadena. NVIDIA entra sólo cuando Gemini no puede.
  if (pool.available) {
    try {
      const visionText = await pool.run(
        async (apiKey) => {
          const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
            model: GEMINI_VISION_MODEL,
          });

          const result = await model.generateContent([
            { text: VISION_PROMPT },
            {
              inlineData: {
                mimeType: image.mimeType,
                data: image.base64,
              },
            },
          ]);

          return result.response.text().trim();
        },
        { deadline },
      );

      if (visionText) return buildResult(visionText);
      console.warn('[vision] Gemini devolvió texto vacío; se intenta NVIDIA.');
    } catch (err) {
      // No se propaga todavía: NVIDIA es el único fallback de imagen que existe,
      // porque GroqCloud no sirve ningún modelo con entrada de imagen.
      console.warn(
        `[vision] Gemini falló (${err instanceof Error ? err.message : String(err)}); se intenta NVIDIA.`,
      );
    }
  }

  if (!nvidiaAvailable()) {
    throw new PlannerVisionError(
      'vision_read_failed',
      'Gemini no pudo leer la imagen y no hay NVIDIA_API_KEY para el fallback.',
    );
  }

  try {
    const visionText = await nvidiaVision(VISION_PROMPT, image, { deadline });
    if (!visionText) {
      throw new PlannerVisionError('vision_read_failed', 'NVIDIA returned empty image text.');
    }
    return buildResult(visionText);
  } catch (err) {
    if (err instanceof PlannerVisionError) throw err;
    throw new PlannerVisionError(
      'vision_read_failed',
      err instanceof Error ? err.message : 'Image read failed on every provider.',
    );
  }
}

function buildResult(visionText: string): PlannerImageReadResult {
  return {
    visionText,
    summary: visionText.split(/\r?\n/)[0] ?? '',
  };
}
