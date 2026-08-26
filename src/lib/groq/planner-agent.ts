import { groq } from './client';
import { GROQ_TEXT_MODEL } from '@/lib/ai/models';
import type { ExtractContext } from './extract-context';
import type { AssistantMessage } from './assistant';
import { classifyPlannerIntent } from './planner-intent';
import { runIntentPipeline } from './planner-tools';
import type { PlannerResponse } from './planner-types';

export type { PlannerResponse } from './planner-types';

const MAX_AGENT_STEPS = 3;

/**
 * Planner agent: intent classification → tool pipeline → structured response.
 * Uses JSON tool pattern (provider-agnostic) instead of native tool-calling.
 */
export async function runPlannerAgent(
  userMessage: string,
  ctx: ExtractContext,
  history: AssistantMessage[] = [],
): Promise<PlannerResponse> {
  let lastClarify: PlannerResponse | null = null;

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const intent = await classifyPlannerIntent(userMessage, ctx, history);
    const result = await runIntentPipeline(intent, ctx);

    if (result.type === 'clarify') {
      lastClarify = {
        type: 'clarify',
        question: result.question,
        options: result.options,
        field: result.field,
      };
      if (intent.confidence < 0.6) return lastClarify;
      continue;
    }

    if (result.type === 'preview_tasks') {
      return { type: 'preview_tasks', tasks: result.tasks, parseError: result.parseError };
    }
    if (result.type === 'preview_events') {
      return { type: 'preview_events', events: result.events, parseError: result.parseError };
    }
    if (result.type === 'preview_plan') {
      return {
        type: 'preview_plan',
        planType: result.planType,
        description: result.description,
        plan: result.plan,
      };
    }
    if (result.type === 'query') {
      return result;
    }
    return { type: 'message', content: result.content };
  }

  return (
    lastClarify ?? {
      type: 'message',
      content: 'Necesito un poco más de información para ayudarte. ¿Qué tareas querés crear?',
    }
  );
}

/** Optional: direct JSON tool loop for future multi-step refinement */
export async function plannerToolLoop(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2048,
  });
  return completion.choices[0]?.message?.content ?? '{}';
}
