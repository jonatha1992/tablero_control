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
  /** Planner enrichment */
  siteLabel?: string;
  locations?: { id: string; name: string }[];
  projects?: { id: string; name: string }[];
  cycles?: { id: string; name: string }[];
  objectives?: { id: string; name: string }[];
  defaultProjectName?: string;
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

FUNCIONALIDADES DEL SISTEMA:
- KANBAN (/dashboard/tareas): Tablero con columnas Backlog → Por hacer → En progreso → En revisión → Finalizado → Bloqueada. Drag & drop entre columnas. Selección múltiple. Filtros por prioridad, sector y búsqueda. Tabs: Todas | Backlog | [Sprint activo] | Otros sprints ▾.
- AGENDA (/dashboard/tareas/agenda): Vista diaria inteligente estilo Toki. Secciones por urgencia: Foco del día (top 3 por score automático), Vencidas, Hoy con hora, Para hoy, Esta semana, Próximamente, Sin fecha, Completadas. Click en el círculo de una tarea abre menú de cambio de estado.
- CALENDARIO (/dashboard/tareas/calendario): Vista mensual/semanal/lista con FullCalendar. Drag & drop para cambiar fechas. Las tareas recurrentes muestran fechas futuras como "fantasmas".
- CICLOS / PLANIFICACIÓN (/dashboard/planificacion): Sprints o períodos de trabajo. Estados: planificación → activo → completado → cerrado. Solo puede haber 1 ciclo activo a la vez. Las tareas se asocian a un ciclo. Para crear desde el chat: "Crear planificación: [descripción]".
- OBJETIVOS (/dashboard/planificacion/objetivos): Metas estratégicas de alto nivel (OKRs o épicas). Muestran progreso 0–100% según tareas completadas. Las tareas se asocian a un objetivo. Para crear desde el chat: "Crear objetivo: [descripción]".
- EQUIPO (/dashboard/equipo): Gestión de miembros del negocio. Roles jerárquicos: superadmin > admin > responsable > miembro > viewer. También permite crear roles personalizados con permisos granulares.
- SECTORES (/dashboard/sectores): Locales, departamentos o ubicaciones del negocio. Las tareas pueden pertenecer a un sector.
- REPORTES (/dashboard/reportes): Sección en desarrollo.
- FACTURACIÓN (/dashboard/billing): Planes disponibles (free/basic/pro/enterprise), estado de suscripción activa, historial de facturas y pagos vía MercadoPago.
- CONFIGURACIÓN (/dashboard/config): Datos del negocio, perfil de usuario, notificaciones push y email.
- ASISTENTE IA (botón flotante abajo a la derecha ✨): Este chat. Desde el chat podés: crear tareas escribiendo "Crear tarea: [descripción]", crear planificaciones escribiendo "Crear planificación: [descripción]", crear objetivos escribiendo "Crear objetivo: [descripción]", o usar el 🎤 para dictar tareas por voz.
- PRIORIDADES: urgent (rojo, bloquea todo) > high (naranja, importante) > medium (azul, normal) > low (verde, cuando haya tiempo).
- ESTADOS DE TAREA: backlog (sin fecha) | por hacer (todo) | en progreso (in_progress) | en revisión (in_review) | finalizado (done) | bloqueada (blocked).
- TAREAS RECURRENTES: una tarea puede repetirse diaria, semanal o mensualmente. Al completarla, el sistema crea automáticamente la siguiente ocurrencia.

Podés ayudar con:
- CONSULTAS sobre tareas: qué está vencido, qué vence esta semana, qué tiene asignado alguien, tareas por prioridad/estado, etc.
- ORIENTACIÓN del sistema: explicar para qué sirve cada sección y cómo usarla
- RESÚMENES: estado general del trabajo, carga por persona, análisis de prioridades
- SUGERENCIAS: buenas prácticas de gestión, cómo organizar el trabajo
- Si el usuario quiere CREAR TAREAS sueltas, informale que puede escribir en el chat "Crear tarea: [descripción]" para que el sistema las extraiga automáticamente, o usar el micrófono 🎤 para dictarlas por voz
- Si el usuario quiere crear una planificación pero NO da suficiente detalle (ej: "quiero planificar algo", "crear un sprint", "hacer una planificación"), PREGUNTALE primero: "¿Qué querés planificar? Dame una descripción del proyecto u objetivo."
- Si el usuario quiere crear un objetivo pero NO da suficiente detalle, PREGUNTALE: "¿Cuál es la meta que querés lograr? Dame más detalles para poder crear el objetivo."
- Cuando el usuario dé una descripción clara, decile exactamente cómo activar la creación: "Escribí: Crear planificación: [su descripción]" o "Crear objetivo: [su descripción]" — citando el formato textual para que lo envíe
- Si ya escribió "Crear planificación: X" o "Crear objetivo: X", el sistema lo procesa automáticamente

Reglas:
- Respondé en español, de forma concisa y clara
- Usá los datos reales de las tareas para responder consultas específicas
- No inventés datos que no tenés
- Si te preguntan por algo que no está en los datos, decilo claramente`;
}

export type AssistantMode = 'assistant' | 'planner';

function formatNamedList(items?: { name: string }[], empty = 'ninguno'): string {
  if (!items?.length) return empty;
  return items.map((i) => i.name).join(', ');
}

function buildPlannerSystemPrompt(ctx: AssistantContext): string {
  const pending = ctx.tasks.filter((t) => t.status !== 'done');
  const overdue = pending.filter((t) => t.isOverdue);
  const inProgress = pending.filter((t) => t.status === 'in_progress');
  const blocked = pending.filter((t) => t.status === 'blocked');

  const now = new Date();
  const todayFormatted = now.toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const site = ctx.siteLabel ?? 'Sede';

  return `Sos el Planificador de Tablero de Control — creás y organizás trabajo en lenguaje natural.

USUARIO: ${ctx.userName} (${ctx.userRole})${ctx.businessName ? ` — espacio: "${ctx.businessName}"` : ''}
HOY: ${todayFormatted}
SPRINT ACTIVO: ${ctx.activeCycleName ?? 'ninguno'}
TABLERO DEFAULT: ${ctx.defaultProjectName ?? 'Principal'}

CONTEXTO DEL ESPACIO:
- ${site}s: ${formatNamedList(ctx.locations)}
- Tableros: ${formatNamedList(ctx.projects)}
- Ciclos/sprints: ${formatNamedList(ctx.cycles)}
- Objetivos: ${formatNamedList(ctx.objectives)}

RESUMEN: ${pending.length} pendientes | ${overdue.length} vencidas | ${inProgress.length} en progreso | ${blocked.length} bloqueadas

TAREAS PENDIENTES (evitar duplicados):
${formatTaskList(pending.slice(0, 50))}

INSTRUCCIONES:
- El usuario puede describir trabajo en lenguaje natural; no exijas el prefijo "Crear tarea:".
- Si falta info (prioridad, fecha, assignee, sprint, tablero, recurrencia), PREGUNTÁ antes de asumir.
- Rutinas (reuniones, reportes, limpieza): preguntá frecuencia (diaria, semanal, quincenal, mensual).
- Podés sugerir descomponer pedidos grandes en subtareas o checklist.
- Revisá duplicados con la lista de pendientes.
- Respondé en español, conciso, orientado a la acción.
- PRIORIDADES: urgent > high > medium > low
- ESTADOS: backlog | todo | in_progress | in_review | done | blocked`;
}

export async function chatWithAssistant(
  messages: AssistantMessage[],
  ctx: AssistantContext,
  mode: AssistantMode = 'assistant',
): Promise<AssistantResponse> {
  const systemPrompt = mode === 'planner' ? buildPlannerSystemPrompt(ctx) : buildSystemPrompt(ctx);
  const { message } = await chatWithRotation(systemPrompt, messages);
  return { message: message || 'No pude generar una respuesta.' };
}
