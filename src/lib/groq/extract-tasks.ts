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
  dueDate?: string;   // ISO YYYY-MM-DD
  dueTime?: string;   // HH:mm 24h
  estimatedHours?: number;
  order: number;      // 1 = primera a ejecutar
  locationId?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    dayOfWeek?: number;
  } | null;
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
Eres un asistente experto en gestión de tareas para cualquier tipo de negocio o industria (restaurantes, comercios, logística, administración, tecnología, salud, educación, etc.). Extraés tareas de trabajo a partir de texto transcripto de audio en español, comprendiendo el contexto del área o sector mencionado.
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
      "assigneeIds": ["userId exacto de la lista arriba, o array vacío"],
      "tags": ["string"],
      "order": 1,
      "estimatedHours": 2,
      "dueDate": "YYYY-MM-DD o null",
      "dueTime": "HH:MM (24h) o null",
      "recurrence": {
        "frequency": "daily" | "weekly" | "monthly",
        "interval": 1,
        "dayOfWeek": 0-6 // 0=Domingo, 1=Lunes... 5=Viernes
      } // o null si no es repetitiva
    }
  ]
}

Reglas:
- Extrae CADA tarea o acción mencionada como un ítem separado.
- order: numerá las tareas por orden lógico de ejecución comenzando en 1.
- estimatedHours: estimá la duración de cada tarea en horas según su complejidad. Mínimo 0.5.
- dueDate: si el usuario menciona una fecha explícita, usala. Si NO menciona fecha, calculá automáticamente: order=1 vence hoy + horas, etc.
- dueTime: si menciona hora ("a las 3", "a las 14:30"), extraé en HH:MM 24h. Sin hora → null.
- recurrence: si dice "todos los viernes", "semanal", "cada mes", "diario", "rutina", genera un objeto recurrence.
  * Ej: "todos los viernes" -> { "frequency": "weekly", "interval": 1, "dayOfWeek": 5 }
  * Ej: "cada dos meses" -> { "frequency": "monthly", "interval": 2 }
  * Si no se menciona repetición, recurrence DEBE ser null.
- status: usa "in_progress" solo si ya está en curso. Si no, usa "todo".
- priority: "urgente"/"hoy" → "urgent"; "importante" → "high"; normal → "medium"; "sin apuro" → "low".
- assigneeIds: buscá coincidencias de nombre. Sin match claro → [].
- Si no hay ninguna tarea reconocible, devuelve { "tasks": [] }.
- IMPORTANTE: No devuelvas markdown, solo el JSON raw.
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
