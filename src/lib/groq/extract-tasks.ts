import { groq } from './client';
import { GROQ_TEXT_MODEL } from '@/lib/ai/models';
import type { ChecklistItem, RecurrenceConfig, TaskPriority, TaskStatus, TaskType } from '@/types/domain/task';
import type { ExtractContext } from './extract-context';
import { buildActionTitle, hasActionIntent } from './intent-heuristics';

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  assigneeIds: string[];
  tags: string[];
  dueDate?: string;
  dueTime?: string;
  estimatedHours?: number;
  order: number;
  locationId?: string;
  projectId?: string;
  /** Copias independientes en varios tableros (prioridad sobre projectId al confirmar). */
  projectIds?: string[];
  cycleId?: string;
  objectiveId?: string;
  checklist?: ChecklistItem[];
  subtasks?: string[];
  recurrence?: RecurrenceConfig | null;
}

function formatList(items: { id: string; name: string; status?: string }[], empty: string): string {
  if (items.length === 0) return empty;
  return items.map((i) => `- "${i.name}" → id: "${i.id}"${i.status ? ` (${i.status})` : ''}`).join('\n');
}

function buildSystemPrompt(ctx: ExtractContext): string {
  const memberList = formatList(ctx.members, '(sin miembros cargados)');
  const locationList = formatList(ctx.locations, `(sin ${ctx.siteLabel.toLowerCase()}s)`);
  const projectList = formatList(ctx.projects, '(sin tableros)');
  const cycleList = formatList(ctx.cycles, '(sin ciclos/sprints)');
  const objectiveList = formatList(ctx.objectives, '(sin objetivos)');

  const defaults: string[] = [];
  if (ctx.defaultProjectId) defaults.push(`tablero por defecto id: "${ctx.defaultProjectId}"`);
  if (ctx.activeCycleId) defaults.push(`sprint activo id: "${ctx.activeCycleId}"`);

  return `
Eres un asistente experto en gestión de tareas. Extraés tareas de texto en español (audio transcripto o chat).
Hoy es ${ctx.today}.
Etiqueta de unidad física/lógica en este espacio: "${ctx.siteLabel}".

Equipo (nombre → userId):
${memberList}

${ctx.siteLabel}s (nombre → id):
${locationList}

Tableros (nombre → id):
${projectList}

Ciclos / sprints (nombre → id):
${cycleList}

Objetivos / épicas (nombre → id):
${objectiveList}

${defaults.length ? `Defaults: ${defaults.join('; ')}` : ''}

Devuelve ÚNICAMENTE JSON válido:
{
  "tasks": [
    {
      "title": "string (requerido, máx 120)",
      "description": "string o null",
      "priority": "low" | "medium" | "high" | "urgent",
      "status": "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked",
      "type": "task" | "feature" | "bug" | "improvement" | "documentation",
      "assigneeIds": ["userId exacto"],
      "tags": ["string"],
      "order": 1,
      "estimatedHours": 2,
      "dueDate": "YYYY-MM-DD o null",
      "dueTime": "HH:MM o null",
      "locationId": "id exacto o null",
      "projectId": "id exacto o null",
      "projectIds": ["id1", "id2"] o null si un solo tablero,
      "cycleId": "id exacto o null",
      "objectiveId": "id exacto o null",
      "checklist": [{ "id": "c1", "text": "paso", "done": false }],
      "recurrence": {
        "frequency": "daily" | "weekly" | "biweekly" | "monthly",
        "interval": 1,
        "dayOfWeek": 0-6,
        "dayOfMonth": 1-31
      }
    }
  ]
}

Qué cuenta como tarea (MUY IMPORTANTE):
- Cualquier intención, necesidad, obligación o pendiente es una tarea. Ejemplos de disparadores:
  "necesito...", "tengo que...", "hay que...", "quiero...", "me falta...", "acordate de...",
  "pendiente:", "falta...", "debería...", "voy a...", "sería bueno...", "hacer...".
- No importa si es vago, corto o sin detalle. "necesito hacer el tema de X" ES una tarea:
  title "Hacer el tema de X" (o la acción normalizada en infinitivo).
- No pidas más contexto ni descartes por falta de detalle. Extraé la tarea con lo que haya
  y dejá en null todo lo que no se mencione.
- Un texto sin verbo explícito pero que nombra un entregable o tema pendiente
  ("mapa del delito", "informe mensual") también es tarea.
- Devolvé { "tasks": [] } SOLO si el texto es puramente conversacional: saludos, preguntas
  sin acción, agradecimientos, comentarios sin nada por hacer.

Reglas:
- Cada acción/tarea mencionada = ítem separado. order desde 1.
- assigneeIds, locationId, projectId, projectIds, cycleId, objectiveId: solo ids de las listas. Sin match → null/[].
- Si menciona varios tableros ("en Marketing y Ventas") → projectIds con todos los ids válidos; projectId null.
- Si un solo tablero → projectId o projectIds de un elemento. Si no menciona tablero → projectId y projectIds null (default en UI).
- Si menciona sprint → cycleId.
- status backlog si es idea futura; todo por defecto; in_progress si ya en curso.
- recurrence: rutinas ("todos los viernes", "quincenal", "cada mes"). Sin repetición → null.
- checklist: pasos o desgloses mencionados dentro de una tarea. No crear subtareas; usá checklist.
- Solo JSON raw, sin markdown.

Ejemplos:
Entrada: "necesito hacer el tema de mapa del delito"
Salida: {"tasks":[{"title":"Hacer el tema de mapa del delito","description":null,"priority":"medium","status":"todo","type":"task","assigneeIds":[],"tags":[],"order":1}]}

Entrada: "hay que llamar al proveedor y mandar la factura el viernes"
Salida: {"tasks":[{"title":"Llamar al proveedor","priority":"medium","status":"todo","type":"task","assigneeIds":[],"tags":[],"order":1},{"title":"Mandar la factura","priority":"medium","status":"todo","type":"task","assigneeIds":[],"tags":[],"order":2,"dueDate":null}]}

Entrada: "hola, cómo va todo?"
Salida: {"tasks":[]}
`.trim();
}

const VALID_STATUSES: TaskStatus[] = [
  'backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked',
];

function sanitizeTask(raw: ExtractedTask, ctx: ExtractContext): ExtractedTask {
  const memberIds = new Set(ctx.members.map((m) => m.id));
  const locationIds = new Set(ctx.locations.map((l) => l.id));
  const projectIds = new Set(ctx.projects.map((p) => p.id));
  const cycleIds = new Set(ctx.cycles.map((c) => c.id));
  const objectiveIds = new Set(ctx.objectives.map((o) => o.id));

  const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'todo';

  const fromArray = (Array.isArray(raw.projectIds) ? raw.projectIds : []).filter(
    (id): id is string => typeof id === 'string' && projectIds.has(id),
  );

  let projectId: string | undefined;
  let resolvedProjectIds: string[] | undefined;

  if (fromArray.length > 0) {
    resolvedProjectIds = fromArray;
    projectId = fromArray.length === 1 ? fromArray[0] : undefined;
  } else if (raw.projectId && projectIds.has(raw.projectId)) {
    projectId = raw.projectId;
    resolvedProjectIds = [raw.projectId];
  } else if (!Array.isArray(raw.projectIds) || raw.projectIds.length === 0) {
    projectId = ctx.defaultProjectId;
    if (ctx.defaultProjectId) {
      resolvedProjectIds = [ctx.defaultProjectId];
    }
  }

  const checklistFromModel = Array.isArray(raw.checklist)
    ? raw.checklist.map((c, i) => ({
        id: c.id ?? `c${i + 1}`,
        text: String(c.text ?? ''),
        done: Boolean(c.done),
      }))
    : [];
  const legacySubtasks = Array.isArray(raw.subtasks)
    ? raw.subtasks.map(String).filter(Boolean)
    : [];
  const checklist = [
    ...checklistFromModel,
    ...legacySubtasks.map((text, i) => ({
      id: `st${i + 1}`,
      text,
      done: false,
    })),
  ];

  return {
    ...raw,
    title: String(raw.title ?? '').slice(0, 120),
    status,
    assigneeIds: (raw.assigneeIds ?? []).filter((id) => memberIds.has(id)),
    locationId: raw.locationId && locationIds.has(raw.locationId) ? raw.locationId : undefined,
    projectId,
    projectIds: resolvedProjectIds,
    cycleId: raw.cycleId && cycleIds.has(raw.cycleId) ? raw.cycleId : undefined,
    objectiveId:
      raw.objectiveId && objectiveIds.has(raw.objectiveId) ? raw.objectiveId : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    checklist: checklist.length ? checklist : undefined,
    subtasks: undefined,
    recurrence: raw.recurrence ?? undefined,
  };
}

/**
 * Crea una tarea minima cuando el texto expresa una intencion clara pero el modelo
 * no devolvio nada. Evita el "No detecte tareas" en pedidos vagos pero validos.
 */
function fallbackTaskFromText(text: string, ctx: ExtractContext): ExtractedTask[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (!hasActionIntent(trimmed)) return [];

  return [
    sanitizeTask(
      {
        title: buildActionTitle(trimmed),
        description: trimmed.length > 120 ? trimmed : undefined,
        priority: 'medium',
        status: 'todo',
        type: 'task',
        assigneeIds: [],
        tags: [],
        order: 1,
      },
      ctx,
    ),
  ];
}

export async function extractTasksFromTranscription(
  transcription: string,
  ctx: ExtractContext,
): Promise<ExtractedTask[]> {
  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: 'system', content: buildSystemPrompt(ctx) },
      { role: 'user', content: transcription },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 4096,
  });

  const raw = completion.choices[0]?.message?.content ?? '{"tasks":[]}';
  const parsed = JSON.parse(raw) as { tasks?: ExtractedTask[] };
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const sanitized = tasks
    .map((t) => sanitizeTask(t, ctx))
    .filter((t) => t.title.trim().length > 0);

  if (sanitized.length === 0) return fallbackTaskFromText(transcription, ctx);
  return sanitized;
}
