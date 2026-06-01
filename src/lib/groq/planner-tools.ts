import type { ExtractContext } from './extract-context';
import type { ExtractedTask } from './extract-tasks';
import { extractTasksFromTranscription } from './extract-tasks';
import { generatePlanFromDescription, type GeneratedPlan } from './generate-plan';
import type { PlannerIntentResult } from './planner-intent';

export type PlannerToolName =
  | 'list_context'
  | 'extract_tasks'
  | 'preview_plan'
  | 'ask_clarification';

export interface PlannerToolCall {
  tool: PlannerToolName;
  args: Record<string, string>;
}

export interface PlannerToolResult {
  tool: PlannerToolName;
  data: unknown;
}

export async function executePlannerTool(
  call: PlannerToolCall,
  ctx: ExtractContext,
): Promise<PlannerToolResult> {
  switch (call.tool) {
    case 'list_context':
      return {
        tool: 'list_context',
        data: {
          members: ctx.members,
          locations: ctx.locations,
          projects: ctx.projects,
          cycles: ctx.cycles,
          objectives: ctx.objectives,
          defaultProjectId: ctx.defaultProjectId,
          activeCycleId: ctx.activeCycleId,
          siteLabel: ctx.siteLabel,
        },
      };
    case 'extract_tasks': {
      const text = call.args.text ?? '';
      const tasks = await extractTasksFromTranscription(text, ctx);
      return { tool: 'extract_tasks', data: { tasks } };
    }
    case 'preview_plan': {
      const type = (call.args.type === 'objective' ? 'objective' : 'cycle') as 'cycle' | 'objective';
      const description = call.args.description ?? '';
      const plan = await generatePlanFromDescription(type, description);
      return { tool: 'preview_plan', data: { type, description, plan } };
    }
    case 'ask_clarification':
      return {
        tool: 'ask_clarification',
        data: {
          question: call.args.question ?? '¿Podés darme más detalles?',
          field: call.args.field ?? 'general',
          options: call.args.options?.split('|').filter(Boolean) ?? [],
        },
      };
    default:
      return { tool: 'ask_clarification', data: { question: 'No entendí la solicitud.' } };
  }
}

export async function runIntentPipeline(
  intent: PlannerIntentResult,
  ctx: ExtractContext,
): Promise<
  | { type: 'clarify'; question: string; options?: string[]; field: string }
  | { type: 'preview_tasks'; tasks: ExtractedTask[]; parseError: boolean }
  | { type: 'preview_plan'; planType: 'cycle' | 'objective'; description: string; plan: GeneratedPlan }
  | { type: 'message'; content: string }
> {
  if (intent.missingSlots.length > 0 && intent.clarificationQuestion) {
    return {
      type: 'clarify',
      question: intent.clarificationQuestion,
      options: intent.suggestedOptions,
      field: intent.missingSlots[0] ?? 'general',
    };
  }

  if (intent.intent === 'create_plan' || intent.intent === 'create_objective') {
    const planType = intent.planType ?? (intent.intent === 'create_objective' ? 'objective' : 'cycle');
    const description = intent.planDescription ?? intent.extractionText ?? '';
    const result = await executePlannerTool(
      { tool: 'preview_plan', args: { type: planType, description } },
      ctx,
    );
    const data = result.data as { type: 'cycle' | 'objective'; description: string; plan: GeneratedPlan };
    return {
      type: 'preview_plan',
      planType: data.type,
      description: data.description,
      plan: data.plan,
    };
  }

  if (intent.intent === 'create_task' || intent.intent === 'create_tasks_batch') {
    try {
      const result = await executePlannerTool(
        { tool: 'extract_tasks', args: { text: intent.extractionText ?? '' } },
        ctx,
      );
      const tasks = (result.data as { tasks: ExtractedTask[] }).tasks;
      if (tasks.length === 0) {
        return {
          type: 'clarify',
          question: 'No pude detectar tareas concretas. ¿Podés describir qué hay que hacer, para cuándo y quién?',
          field: 'title',
          options: ['Sin fecha', 'Para hoy', 'Para esta semana'],
        };
      }
      return { type: 'preview_tasks', tasks, parseError: false };
    } catch {
      return {
        type: 'message',
        content: 'Hubo un error al procesar las tareas. Intentá de nuevo con más detalle.',
      };
    }
  }

  if (intent.intent === 'query') {
    return {
      type: 'message',
      content: 'Para consultas sobre tareas existentes usá la pestaña Asistente. Acá puedo ayudarte a crear tareas, sprints u objetivos.',
    };
  }

  return {
    type: 'clarify',
    question: intent.clarificationQuestion ?? '¿Querés crear tareas, un sprint o un objetivo? Contame con más detalle.',
    options: ['Crear tareas', 'Crear sprint', 'Crear objetivo'],
    field: 'intent',
  };
}
