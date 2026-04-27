import { groq } from './client';
import type { TaskPriority, TaskStatus, TaskType } from '@/types/domain/task';

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: Extract<TaskStatus, 'todo' | 'in_progress'>;
  type: TaskType;
  assigneeIds: string[];
  tags: string[];
  dueDate?: string; // ISO YYYY-MM-DD
}

interface Member {
  id: string;
  name: string;
}

function buildSystemPrompt(members: Member[], today: string): string {
  const memberList =
    members.length > 0
      ? members.map((m) => `- "${m.name}" → id: "${m.id}"`).join('\n')
      : '(sin miembros cargados)';

  return `
Eres un asistente que extrae tareas de trabajo a partir de texto transcripto de audio en español.
Hoy es ${today}.

Equipo disponible (nombre → userId):
${memberList}

Devuelve ÚNICAMENTE un JSON válido, sin texto adicional, con este esquema exacto:
{
  "tasks": [
    {
      "title": "string (requerido, máx 120 chars)",
      "description": "string o null",
      "priority": "low" | "medium" | "high" | "urgent",
      "status": "todo" | "in_progress",
      "type": "task" | "feature" | "bug" | "improvement" | "documentation",
      "assigneeIds": ["userId exacto de la lista arriba, o array vacío si no se menciona nadie"],
      "tags": ["string"],
      "dueDate": "YYYY-MM-DD o null"
    }
  ]
}

Reglas:
- Extrae CADA tarea o acción mencionada como un ítem separado.
- status: usa "in_progress" solo si el audio dice explícitamente que ya está en curso ("estamos haciendo", "ya empezamos"); si no, usa "todo".
- priority: "urgente" / "para hoy" / "lo antes posible" → "urgent"; "importante" → "high"; sin mención → "medium"; "cuando puedas" / "no es urgente" → "low".
- assigneeIds: busca coincidencias de nombre (puede ser primer nombre, apodo o similar). Si no hay match claro en la lista, usa [].
- dueDate: si dice "para el viernes", "para mañana", "en dos días", calcula la fecha ISO desde hoy (${today}). Sin fecha → null.
- Si no hay ninguna tarea reconocible en el texto, devuelve { "tasks": [] }.
- No devuelvas explicaciones, markdown, ni texto fuera del JSON.
`.trim();
}

export async function extractTasksFromTranscription(
  transcription: string,
  members: Member[],
): Promise<ExtractedTask[]> {
  const today = new Date().toISOString().split('T')[0];

  const completion = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      { role: 'system', content: buildSystemPrompt(members, today) },
      { role: 'user', content: transcription },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2048,
  });

  const raw = completion.choices[0]?.message?.content ?? '{"tasks":[]}';
  const parsed = JSON.parse(raw) as { tasks?: unknown[] };
  return Array.isArray(parsed.tasks) ? (parsed.tasks as ExtractedTask[]) : [];
}
