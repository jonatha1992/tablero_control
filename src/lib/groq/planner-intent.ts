import { groq } from './client';
import { GROQ_TEXT_MODEL } from '@/lib/ai/models';
import type { ExtractContext } from './extract-context';
import type { AssistantMessage } from './assistant';
import { classifyActionKind, hasActionIntent } from './intent-heuristics';

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

Principio base (NO NEGOCIABLE):
Todo mensaje del usuario es una de tres cosas: una TAREA, un EVENTO o una CONSULTA.
Si expresa que algo debe hacerse ("necesito...", "tengo que...", "hay que...", "me falta...",
"alguien tiene que...", "quiero...", "falta...", "pendiente..."), es trabajo por hacer:
NUNCA preguntes si es tarea o evento, decidilo vos con las reglas de abajo.

Cómo decidir entre EVENTO y TAREA:
- create_event si el núcleo es ESTAR en un lugar o momento con otros: verbos de
  desplazamiento o presencia ("ir a", "hay que ir a", "asistir", "pasar por", "acercarse a",
  "visitar", "viajar a", "juntarse", "reunirse con", "presentarse en"), o sustantivos de
  agenda ("reunión", "cita", "turno", "examen", "parcial", "entrevista", "llamado a las X",
  "capacitación", "audiencia"), o cuando hay fecha/hora fija + lugar o personas.
  "hay que ir a la sede centro" → create_event.
- create_task si el núcleo es PRODUCIR o resolver algo: "hacer", "armar", "escribir",
  "mandar", "revisar", "corregir", "comprar", "cargar", "actualizar", "llamar a" (gestión),
  "el tema de X", "el informe de X".
  "necesito hacer el tema de mapa del delito" → create_task.
- Duda genuina entre los dos → create_task. Es reversible desde el preview; preguntar no.

Reglas:
- create_task/create_tasks_batch: quiere crear trabajo (aunque no diga "crear tarea").
  Varias acciones en un mensaje → create_tasks_batch.
- create_plan: sprint/ciclo/planificación. create_objective: objetivo/épica/meta/OKR.
- query: SOLO preguntas sobre datos existentes o cómo usar el sistema
  ("¿cuántas tareas tengo?", "¿cómo creo un sprint?"). Un pedido no es una consulta.
- unknown + clarificationQuestion: reservado para mensajes sin ninguna acción
  ("hacé algo", "organizame", "dale"). Nunca por falta de fecha, responsable o tablero:
  eso se completa después en el preview.
- Nunca uses missingSlots ["kind"] ni preguntes "¿Evento o Tarea?".
- extractionText: reescribí claro lo que hay que crear; no inventes assignees.
`.trim();

  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 2048,
    // Clasificar no necesita razonamiento largo: medido baja de ~250 a ~67 tokens
    // de salida sin perder aciertos, y deja margen contra el limite de TPM.
    reasoning_effort: 'low',
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as PlannerIntentResult;

  return resolveIntent(
    {
      intent: parsed.intent ?? 'unknown',
      confidence: parsed.confidence ?? 0.5,
      extractionText: parsed.extractionText ?? userMessage,
      planType: parsed.planType,
      planDescription: parsed.planDescription,
      missingSlots: parsed.missingSlots ?? [],
      clarificationQuestion: parsed.clarificationQuestion,
      suggestedOptions: parsed.suggestedOptions,
    },
    userMessage,
  );
}

/** Slots que nunca justifican frenar al usuario: se completan en el preview. */
const NON_BLOCKING_SLOTS = new Set([
  'kind',
  'type',
  'duedate',
  'due_date',
  'startdate',
  'start_date',
  'starttime',
  'start_time',
  'enddate',
  'end_date',
  'fecha',
  'fechas',
  'hora',
  'horario',
  'time',
  'when',
  'cuando',
  'lugar',
  'place',
  'assignee',
  'assignees',
  'responsable',
  'project',
  'projectid',
  'tablero',
  'priority',
  'prioridad',
  'location',
  'sede',
]);

/**
 * Red de seguridad determinista sobre la salida del LLM.
 *
 * Si el mensaje expresa algo por hacer, el sistema resuelve solo si es tarea o evento
 * en vez de devolver "unknown" y preguntar. Solo sobrevive el clarify cuando el texto
 * no tiene ninguna accion reconocible.
 */
export function resolveIntent(
  result: PlannerIntentResult,
  userMessage: string,
): PlannerIntentResult {
  const actionable = hasActionIntent(userMessage);

  const missingSlots = result.missingSlots.filter(
    (slot) => !NON_BLOCKING_SLOTS.has(slot.trim().toLowerCase()),
  );

  // El LLM se quedo sin decidir, pero el usuario si pidio algo: decidimos nosotros.
  if (actionable && (result.intent === 'unknown' || result.intent === 'query')) {
    const kind = classifyActionKind(userMessage);
    return {
      ...result,
      intent: kind === 'event' ? 'create_event' : 'create_task',
      confidence: Math.max(result.confidence, 0.6),
      missingSlots: [],
      clarificationQuestion: undefined,
      suggestedOptions: undefined,
    };
  }

  // Pidio algo y el LLM acerto el intent: nunca frenar por un campo opcional.
  if (actionable && missingSlots.length === 0) {
    return {
      ...result,
      missingSlots: [],
      clarificationQuestion: undefined,
      suggestedOptions: undefined,
    };
  }

  return { ...result, missingSlots };
}
