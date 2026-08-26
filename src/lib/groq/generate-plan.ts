import { groq } from './client';
import { GROQ_TEXT_MODEL } from '@/lib/ai/models';
import type { TaskPriority } from '@/types/domain/task';

export interface GeneratedTask {
  title: string;
  priority: TaskPriority;
  estimatedHours: number;
  dueDate?: string;
  tags: string[];
}

export interface GeneratedPlan {
  name: string;
  goal: string;
  startDate?: string;
  endDate?: string;
  targetDate?: string;
  tasks: GeneratedTask[];
}

function buildSystemPrompt(type: 'cycle' | 'objective', today: string): string {
  const isCycle = type === 'cycle';
  return `Sos un experto en gestión de proyectos. El usuario te da una descripción y vos generás un plan estructurado.
Hoy es ${today}.

Generá un ${isCycle ? 'ciclo/sprint de trabajo' : 'objetivo estratégico'} con sus tareas.

Devolvé ÚNICAMENTE JSON válido, sin markdown, con este esquema exacto:
{
  "name": "string (nombre conciso del ${isCycle ? 'ciclo' : 'objetivo'}, máx 60 chars)",
  "goal": "string (descripción de la meta, máx 200 chars)",
  ${isCycle ? `"startDate": "YYYY-MM-DD (hoy o próximo lunes)",
  "endDate": "YYYY-MM-DD (2-4 semanas desde startDate)",` : `"targetDate": "YYYY-MM-DD (fecha realista para lograr el objetivo, 1-3 meses)",`}
  "tasks": [
    {
      "title": "string (acción concreta, máx 120 chars)",
      "priority": "low" | "medium" | "high" | "urgent",
      "estimatedHours": 1,
      "dueDate": "YYYY-MM-DD (fecha dentro del rango del ${isCycle ? 'ciclo' : 'objetivo'})",
      "tags": ["string"]
    }
  ]
}

Reglas:
- Generá entre 4 y 8 tareas concretas y accionables
- Las tareas deben cubrir TODO el proceso de principio a fin
- Distribuí las fechas de vencimiento progresivamente dentro del rango
- priority: urgente/bloqueante → urgent, importante → high, normal → medium, deseable → low
- estimatedHours: mínimo 0.5, estimá según complejidad real
- tags: 1-3 tags relevantes al dominio (ej: ["marketing", "diseño"])
- SOLO JSON, sin texto adicional`.trim();
}

export async function generatePlanFromDescription(
  type: 'cycle' | 'objective',
  description: string,
): Promise<GeneratedPlan> {
  const today = new Date().toISOString().split('T')[0];

  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: 'system', content: buildSystemPrompt(type, today) },
      { role: 'user', content: description },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 800,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as GeneratedPlan;

  if (!parsed.name || !Array.isArray(parsed.tasks)) {
    throw new Error('Respuesta inválida del modelo');
  }

  return parsed;
}
