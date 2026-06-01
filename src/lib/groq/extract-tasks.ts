import { groq } from './client';
import type { ChecklistItem, RecurrenceConfig, TaskPriority, TaskStatus, TaskType } from '@/types/domain/task';
import type { ExtractContext } from './extract-context';

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
      "cycleId": "id exacto o null",
      "objectiveId": "id exacto o null",
      "checklist": [{ "id": "c1", "text": "paso", "done": false }],
      "subtasks": ["título subtarea"],
      "recurrence": {
        "frequency": "daily" | "weekly" | "biweekly" | "monthly",
        "interval": 1,
        "dayOfWeek": 0-6,
        "dayOfMonth": 1-31
      }
    }
  ]
}

Reglas:
- Cada acción/tarea mencionada = ítem separado. order desde 1.
- assigneeIds, locationId, projectId, cycleId, objectiveId: solo ids de las listas. Sin match → null/[].
- Si no menciona tablero → projectId null (el sistema usará default). Si menciona sprint → cycleId.
- status backlog si es idea futura; todo por defecto; in_progress si ya en curso.
- recurrence: rutinas ("todos los viernes", "quincenal", "cada mes"). Sin repetición → null.
- checklist: pasos mencionados dentro de una tarea. subtasks: tareas hijas con título propio.
- Sin tareas reconocibles → { "tasks": [] }.
- Solo JSON raw, sin markdown.
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

  return {
    ...raw,
    title: String(raw.title ?? '').slice(0, 120),
    status,
    assigneeIds: (raw.assigneeIds ?? []).filter((id) => memberIds.has(id)),
    locationId: raw.locationId && locationIds.has(raw.locationId) ? raw.locationId : undefined,
    projectId:
      raw.projectId && projectIds.has(raw.projectId)
        ? raw.projectId
        : ctx.defaultProjectId,
    cycleId: raw.cycleId && cycleIds.has(raw.cycleId) ? raw.cycleId : undefined,
    objectiveId:
      raw.objectiveId && objectiveIds.has(raw.objectiveId) ? raw.objectiveId : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    checklist: Array.isArray(raw.checklist)
      ? raw.checklist.map((c, i) => ({
          id: c.id ?? `c${i + 1}`,
          text: String(c.text ?? ''),
          done: Boolean(c.done),
        }))
      : undefined,
    subtasks: Array.isArray(raw.subtasks) ? raw.subtasks.map(String).filter(Boolean) : undefined,
    recurrence: raw.recurrence ?? undefined,
  };
}

export async function extractTasksFromTranscription(
  transcription: string,
  ctx: ExtractContext,
): Promise<ExtractedTask[]> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
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
  return tasks.map((t) => sanitizeTask(t, ctx));
}
