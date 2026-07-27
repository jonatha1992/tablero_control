import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PlannerImagePayload } from '@/lib/ai/planner-image-contract';

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
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey === 'no-key') {
    throw new PlannerVisionError(
      'missing_google_ai_key',
      'GOOGLE_AI_API_KEY is required to read planner images.',
    );
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      { text: VISION_PROMPT },
      {
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64,
        },
      },
    ]);

    const visionText = result.response.text().trim();
    if (!visionText) {
      throw new PlannerVisionError('vision_read_failed', 'Gemini returned empty image text.');
    }

    return {
      visionText,
      summary: visionText.split(/\r?\n/)[0] ?? '',
    };
  } catch (err) {
    if (err instanceof PlannerVisionError) throw err;
    throw new PlannerVisionError(
      'vision_read_failed',
      err instanceof Error ? err.message : 'Gemini image read failed.',
    );
  }
}
