import { chatWithRotation } from '@/lib/ai/rotate';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TaskSummary {
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignees: string[];
  cycleName?: string;
  isOverdue: boolean;
}

export interface AssistantContext {
  userName: string;
  userRole: string;
  businessName?: string;
  activeCycleName?: string;
  tasks: TaskSummary[];
  today: string;
}

export interface AssistantResponse {
  message: string;
}

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Por hacer',
  in_progress: 'En progreso',
  in_review: 'En revisión',
  done: 'Finalizado',
  blocked: 'Bloqueada',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

function formatTaskList(tasks: TaskSummary[]): string {
  if (tasks.length === 0) return 'Ninguna.';
  return tasks
    .map((t) => {
      const parts = [`- "${t.title}" [${STATUS_LABELS[t.status] ?? t.status}] [${PRIORITY_LABELS[t.priority] ?? t.priority}]`];
      if (t.dueDate) parts.push(`vence: ${t.dueDate}${t.isOverdue ? ' ⚠️ VENCIDA' : ''}`);
      if (t.assignees.length) parts.push(`asignada a: ${t.assignees.join(', ')}`);
      if (t.cycleName) parts.push(`sprint: ${t.cycleName}`);
      return parts.join(' | ');
    })
    .join('\n');
}

function buildSystemPrompt(ctx: AssistantContext): string {
  const pending = ctx.tasks.filter((t) => t.status !== 'done');
  const overdue = pending.filter((t) => t.isOverdue);
  const today = pending.filter((t) => t.dueDate === ctx.today && !t.isOverdue);
  const inProgress = pending.filter((t) => t.status === 'in_progress');
  const blocked = pending.filter((t) => t.status === 'blocked');
  const done = ctx.tasks.filter((t) => t.status === 'done');

  const now = new Date();
  const currentYear = now.getFullYear();
  const todayFormatted = now.toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `Sos el asistente de IA de Tablero de Control, un SaaS de gestión de tareas y proyectos.

USUARIO: ${ctx.userName} (${ctx.userRole})${ctx.businessName ? ` — negocio: "${ctx.businessName}"` : ''}
HOY: ${todayFormatted}
AÑO ACTUAL: ${currentYear}
SPRINT ACTIVO: ${ctx.activeCycleName ?? 'ninguno'}

REGLAS PARA MOSTRAR FECHAS EN TUS RESPUESTAS (OBLIGATORIO):
- Fecha de hoy (${ctx.today}) → "hoy"
- Mañana → "mañana"
- Esta semana (misma semana calendario) → solo el día ("el jueves", "el lunes")
- La semana que viene → "el jueves que viene" / "el lunes de la semana que viene"
- Este mes → "el jueves 22" (sin año)
- El mes que viene → "el lunes 3 de junio" (sin año)
- Solo incluir el año si es DIFERENTE a ${currentYear}
- NUNCA mostrar fechas en formato ISO (YYYY-MM-DD ni DD/MM/YYYY)
- Si el usuario pregunta por esta semana o este mes → NUNCA mencionar el año

RESUMEN: ${pending.length} pendientes | ${overdue.length} vencidas | ${inProgress.length} en progreso | ${blocked.length} bloqueadas | ${done.length} finalizadas

TAREAS VENCIDAS (${overdue.length}):
${formatTaskList(overdue)}

TAREAS PARA HOY (${today.length}):
${formatTaskList(today)}

EN PROGRESO (${inProgress.length}):
${formatTaskList(inProgress)}

BLOQUEADAS (${blocked.length}):
${formatTaskList(blocked)}

TODAS LAS TAREAS PENDIENTES (${pending.length}):
${formatTaskList(pending)}

---

Podés ayudar con:
- CONSULTAS sobre tareas: qué está vencido, qué vence esta semana, qué tiene asignado alguien, tareas por prioridad/estado, etc.
- ORIENTACIÓN del sistema: cómo usar Kanban, Agenda, Sprints, Objetivos, Calendario, Cronograma, Equipo, Sectores, Reportes, Facturación
- RESÚMENES: estado general del trabajo, carga por persona, análisis de prioridades
- SUGERENCIAS: buenas prácticas de gestión, cómo organizar el trabajo
- Si el usuario quiere CREAR TAREAS, indicale que use el tab "Crear tareas"

Reglas:
- Respondé en español, de forma concisa y clara
- Usá los datos reales de las tareas para responder consultas específicas
- No inventés datos que no tenés
- Si te preguntan por algo que no está en los datos, decilo claramente`;
}

export async function chatWithAssistant(
  messages: AssistantMessage[],
  ctx: AssistantContext,
): Promise<AssistantResponse> {
  const systemPrompt = buildSystemPrompt(ctx);
  const { message } = await chatWithRotation(systemPrompt, messages);
  return { message: message || 'No pude generar una respuesta.' };
}
