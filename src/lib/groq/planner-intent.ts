import { groq } from './client';
import type { ExtractContext } from './extract-context';
import type { AssistantMessage } from './assistant';

export type PlannerIntentType =
  | 'create_task'
  | 'create_tasks_batch'
  | 'create_event'
  | 'create_plan'
  | 'create_objective'
  | 'query'
  | 'unknown';

export interface PlannerIntentResult {
  intent: PlannerIntentType;
  confidence: number;
  extractionText?: string;
  planType?: 'cycle' | 'objective';
  planDescription?: string;
  missingSlots: string[];
  clarificationQuestion?: string;
  suggestedOptions?: string[];
}

function formatHistory(messages: AssistantMessage[]): string {
  return messages
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
    .join('\n');
}

export async function classifyPlannerIntent(
  userMessage: string,
  ctx: ExtractContext,
  history: AssistantMessage[] = [],
): Promise<PlannerIntentResult> {
  const prompt = `
Clasificá la intención del usuario en el Planificador de tareas.
Hoy: ${ctx.today}

Miembros: ${ctx.members.map((m) => m.name).join(', ') || 'ninguno'}
Tableros: ${ctx.projects.map((p) => p.name).join(', ') || 'ninguno'}
Sprints: ${ctx.cycles.map((c) => c.name).join(', ') || 'ninguno'}

Historial reciente:
${formatHistory(history)}

Mensaje actual: "${userMessage}"

Respondé SOLO JSON:
{
  "intent": "create_task" | "create_tasks_batch" | "create_event" | "create_plan" | "create_objective" | "query" | "unknown",
  "confidence": 0.0-1.0,
  "extractionText": "texto consolidado para extraer tareas o eventos (incluir contexto del hilo si aplica)",
  "planType": "cycle" | "objective" | null,
  "planDescription": "descripción del plan si aplica",
  "missingSlots": ["campo que falta"],
  "clarificationQuestion": "pregunta al usuario si falta info crítica",
  "suggestedOptions": ["opción 1", "opción 2"]
}

Reglas:
- create_task/create_tasks_batch: quiere crear trabajo (aunque no diga "crear tarea").
- create_event: quiere agendar un evento, examen, reunión, cita o recordatorio tipo "avisame del ...".
- create_plan: sprint/ciclo/planificación. create_objective: objetivo/épica/meta/OKR.
- query: pregunta sobre tareas existentes o cómo usar el sistema.
- Si no queda claro si quiere tarea o evento, devolver intent "unknown", missingSlots ["kind"], clarificationQuestion preguntando si es Evento o Tarea y suggestedOptions ["Evento", "Tarea"].
- Si el mensaje es muy vago ("hacé algo", "organizame") → missingSlots + clarificationQuestion.
- extractionText: reescribí claro lo que hay que crear; no inventes assignees.
`.trim();

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1024,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as PlannerIntentResult;
  return {
    intent: parsed.intent ?? 'unknown',
    confidence: parsed.confidence ?? 0.5,
    extractionText: parsed.extractionText ?? userMessage,
    planType: parsed.planType,
    planDescription: parsed.planDescription,
    missingSlots: parsed.missingSlots ?? [],
    clarificationQuestion: parsed.clarificationQuestion,
    suggestedOptions: parsed.suggestedOptions,
  };
}
