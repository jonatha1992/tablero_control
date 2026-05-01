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
      "dueTime": "HH:MM (24h) o null"
    }
  ]
}

Reglas:
- Extrae CADA tarea o acción mencionada como un ítem separado.
- order: numerá las tareas por orden lógico de ejecución comenzando en 1. Si B depende de A para poder empezarse, A tiene order menor que B. El order define la secuencia de trabajo.
- estimatedHours: estimá la duración de cada tarea en horas según su complejidad y naturaleza. Guía general: tarea simple o corta = 0.5-2h, tarea de complejidad media = 2-4h, tarea compleja o que requiere coordinación = 4-8h, proyecto o entregable grande = 8h+. Adaptá la estimación al contexto real de la tarea (puede ser cocina, ventas, atención al cliente, administración, tecnología, logística, etc.). Mínimo 0.5.
- dueDate: si el usuario menciona una fecha explícita, usala. Si NO menciona fecha, calculá automáticamente en base a la secuencia: la tarea con order=1 vence hoy + sus estimatedHours (considerando 8 horas hábiles por día); la tarea con order=2 vence cuando termina la de order=1 + sus propias horas; y así sucesivamente. Nunca dejes dueDate en null si hay estimatedHours.
- dueTime: si menciona hora ("a las 3", "a las 14:30"), extraé en HH:MM 24h. Sin hora → null.
- status: usa "in_progress" solo si el audio dice explícitamente que ya está en curso. Si no, usa "todo".
- priority: "urgente"/"para hoy"/"lo antes posible" → "urgent"; "importante" → "high"; sin mención → "medium"; "cuando puedas"/"no es urgente" → "low".
- assigneeIds: buscá coincidencias de nombre (primer nombre, apodo). Sin match claro → [].
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
