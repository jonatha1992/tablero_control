import { groq } from '@/lib/groq/client';
import type { ExtractContext } from '@/lib/groq/extract-context';

export interface ExtractedEvent {
  title: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  allDay: boolean;
  assigneeIds: string[];
  color?: string;
  order: number;
}

interface RawExtractedEvent {
  title?: unknown;
  description?: unknown;
  startDate?: unknown;
  startTime?: unknown;
  endDate?: unknown;
  endTime?: unknown;
  allDay?: unknown;
  assigneeIds?: unknown;
  color?: unknown;
  order?: unknown;
}

function formatMemberList(items: { id: string; name: string }[]): string {
  if (items.length === 0) return '(sin miembros cargados)';
  return items.map((item) => `- "${item.name}" -> id: "${item.id}"`).join('\n');
}

function buildSystemPrompt(ctx: ExtractContext): string {
  return `
Eres un asistente experto en calendario. Extraes eventos de texto en español.
Hoy es ${ctx.today}.
Etiqueta de unidad física/lógica en este espacio: "${ctx.siteLabel}".

Equipo (nombre -> userId):
${formatMemberList(ctx.members)}

Devuelve UNICAMENTE JSON valido:
{
  "events": [
    {
      "title": "string (requerido, max 120)",
      "description": "string o null",
      "startDate": "YYYY-MM-DD",
      "startTime": "HH:MM o null",
      "endDate": "YYYY-MM-DD o null",
      "endTime": "HH:MM o null",
      "allDay": true,
      "assigneeIds": ["userId exacto"],
      "color": "#RRGGBB o null",
      "order": 1
    }
  ]
}

Reglas:
- Cada evento mencionado = item separado. order desde 1.
- title obligatorio y breve.
- Si no se menciona hora, usar startTime null y allDay true.
- Si se menciona rango horario, usar allDay false.
- assigneeIds: solo ids exactos de la lista. Sin match -> [].
- endDate y endTime pueden ser null si no se mencionan.
- Si no hay eventos reconocibles -> { "events": [] }.
- Solo JSON raw, sin markdown.
`.trim();
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asOptionalTime(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return /^\d{2}:\d{2}$/.test(value) ? value : undefined;
}

function sanitizeEvent(raw: RawExtractedEvent, ctx: ExtractContext, fallbackOrder: number): ExtractedEvent | null {
  const title = String(raw.title ?? '').trim().slice(0, 120);
  const startDate = asOptionalString(raw.startDate);

  if (!title || !startDate) return null;

  const memberIds = new Set(ctx.members.map((member) => member.id));
  const startTime = asOptionalTime(raw.startTime);
  const endTime = asOptionalTime(raw.endTime);
  const hasExplicitTime = Boolean(startTime || endTime);

  return {
    title,
    description: asOptionalString(raw.description),
    startDate,
    startTime,
    endDate: asOptionalString(raw.endDate),
    endTime,
    allDay: hasExplicitTime ? false : true,
    assigneeIds: Array.isArray(raw.assigneeIds)
      ? raw.assigneeIds.filter((id): id is string => typeof id === 'string' && memberIds.has(id))
      : [],
    color: asOptionalString(raw.color),
    order:
      typeof raw.order === 'number' && Number.isFinite(raw.order) && raw.order > 0
        ? Math.trunc(raw.order)
        : fallbackOrder,
  };
}

export async function extractEventsFromText(
  text: string,
  ctx: ExtractContext,
): Promise<ExtractedEvent[]> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: buildSystemPrompt(ctx) },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 4096,
  });

  const rawContent = completion.choices[0]?.message?.content ?? '{"events":[]}';
  const parsed = JSON.parse(rawContent) as { events?: RawExtractedEvent[] };
  const events = Array.isArray(parsed.events) ? parsed.events : [];

  return events
    .map((event, index) => sanitizeEvent(event, ctx, index + 1))
    .filter((event): event is ExtractedEvent => event !== null);
}
