import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { handle } from '@/lib/api/route-handler';
import { loadExtractContext } from '@/lib/groq/extract-context';
import { runPlannerAgent } from '@/lib/groq/planner-agent';
import { chatWithAssistant } from '@/lib/groq/assistant';
import { buildAssistantContext } from '@/lib/assistant-context';
import type { AssistantMessage } from '@/lib/groq/assistant';
import type { PlannerResponse } from '@/lib/groq/planner-types';

export const maxDuration = 60;

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  let body: { message?: string; messages?: AssistantMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: 'message_required' }, { status: 400 });
  }

  const history = Array.isArray(body.messages) ? body.messages : [];

  if (!user.businessId) {
    const fallback: PlannerResponse = {
      type: 'message',
      content: 'Necesitás estar en un espacio activo para crear tareas.',
    };
    return NextResponse.json(fallback);
  }

  try {
    const ctx = await loadExtractContext(user.businessId);
    const result = await runPlannerAgent(message, ctx, history);

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
        [...history, { role: 'user', content: message }],
        chatCtx,
        'assistant'
      );

      return NextResponse.json({ type: 'message', content: chatResult.message });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[assistant/planner]', err);
    return NextResponse.json(
      { type: 'message', content: 'No pude procesar tu solicitud. Intentá de nuevo.' } satisfies PlannerResponse,
      { status: 500 },
    );
  }
});
