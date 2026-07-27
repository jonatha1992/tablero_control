import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { handle } from '@/lib/api/route-handler';
import { loadExtractContext } from '@/lib/groq/extract-context';
import { runPlannerAgent } from '@/lib/groq/planner-agent';
import { chatWithAssistant } from '@/lib/groq/assistant';
import { buildAssistantContext } from '@/lib/assistant-context';
import {
  isPlannerImageMimeType,
  PLANNER_IMAGE_MAX_BYTES,
  type PlannerImagePayload,
} from '@/lib/ai/planner-image-contract';
import { PlannerVisionError, readImageForPlanner } from '@/lib/ai/vision-image';
import type { AssistantMessage } from '@/lib/groq/assistant';
import type { PlannerResponse } from '@/lib/groq/planner-types';

export const maxDuration = 60;

interface PlannerRequestBody {
  message?: unknown;
  messages?: unknown;
  image?: unknown;
}

function parseAssistantHistory(messages: unknown): AssistantMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages.filter((message): message is AssistantMessage => {
    if (!message || typeof message !== 'object') return false;
    const candidate = message as { role?: unknown; content?: unknown };
    return (
      (candidate.role === 'user' || candidate.role === 'assistant') &&
      typeof candidate.content === 'string' &&
      candidate.content.trim().length > 0
    );
  });
}

function cleanBase64(input: string): string {
  return input.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '').replace(/\s/g, '');
}

function decodedBase64Bytes(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function parsePlannerImage(value: unknown):
  | { image: PlannerImagePayload; error?: never }
  | { image?: never; error?: { error: string; detail: string } } {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { error: { error: 'invalid_image', detail: 'La imagen adjunta no tiene un formato valido.' } };
  }

  const candidate = value as { mimeType?: unknown; base64?: unknown };
  if (typeof candidate.mimeType !== 'string' || typeof candidate.base64 !== 'string') {
    return { error: { error: 'invalid_image', detail: 'La imagen debe incluir mimeType y base64.' } };
  }

  const mimeType = candidate.mimeType.trim().toLowerCase();
  if (!isPlannerImageMimeType(mimeType)) {
    return {
      error: {
        error: 'unsupported_image_type',
        detail: 'Solo se aceptan imagenes jpeg, png, webp o gif.',
      },
    };
  }

  const base64 = cleanBase64(candidate.base64);
  if (!base64 || base64.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    return { error: { error: 'invalid_image_base64', detail: 'La imagen adjunta no es base64 valido.' } };
  }

  if (decodedBase64Bytes(base64) > PLANNER_IMAGE_MAX_BYTES) {
    return {
      error: {
        error: 'image_too_large',
        detail: 'La imagen no puede superar 4 MB.',
      },
    };
  }

  return { image: { mimeType, base64 } };
}

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  let body: PlannerRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const parsedImage = parsePlannerImage(body.image);
  if (parsedImage.error) {
    return NextResponse.json(parsedImage.error, { status: 400 });
  }

  if (!message && !parsedImage.image) {
    return NextResponse.json({ error: 'message_required' }, { status: 400 });
  }

  const history = parseAssistantHistory(body.messages);

  if (!user.businessId) {
    const fallback: PlannerResponse = {
      type: 'message',
      content: 'Necesitas estar en un espacio activo para crear tareas.',
    };
    return NextResponse.json(fallback);
  }

  try {
    const ctx = await loadExtractContext(user.businessId);
    let effectiveMessage = message;

    if (parsedImage.image) {
      try {
        const imageRead = await readImageForPlanner(parsedImage.image);
        const imageContent = `[Contenido de la imagen]\n${imageRead.visionText}`;
        effectiveMessage = message ? `${message}\n\n${imageContent}` : imageContent;
      } catch (err) {
        if (err instanceof PlannerVisionError && err.code === 'missing_google_ai_key') {
          return NextResponse.json({
            type: 'message',
            content: 'Para leer imagenes hay que configurar GOOGLE_AI_API_KEY en el entorno.',
          } satisfies PlannerResponse);
        }

        console.error('[assistant/planner:image]', err);
        return NextResponse.json({
          type: 'message',
          content: 'No pude leer la imagen. Proba con una captura mas clara o describime el contenido.',
        } satisfies PlannerResponse);
      }
    }

    const result = await runPlannerAgent(effectiveMessage, ctx, history);

    if (result.type === 'query') {
      const businessName = user.data.memberships?.find(
        (m) => m.businessId === user.businessId,
      )?.businessName;

      const chatCtx = await buildAssistantContext({
        businessId: user.businessId,
        userName: user.data.name,
        userRole: user.role,
        businessName,
      });

      const chatResult = await chatWithAssistant(
        [...history, { role: 'user', content: effectiveMessage }],
        chatCtx,
        'assistant',
      );

      return NextResponse.json({ type: 'message', content: chatResult.message });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[assistant/planner]', err);
    return NextResponse.json(
      { type: 'message', content: 'No pude procesar tu solicitud. Intenta de nuevo.' } satisfies PlannerResponse,
      { status: 500 },
    );
  }
});
