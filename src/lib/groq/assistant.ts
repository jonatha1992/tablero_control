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
  in_review: 'En revisiÃ³n',
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
      if (t.dueDate) parts.push(`vence: ${t.dueDate}${t.isOverdue ? ' âš ï¸ VENCIDA' : ''}`);
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

  return `Sos el asistente de IA de Tablero de Control, un SaaS de gestiÃ³n de tareas y proyectos.

USUARIO: ${ctx.userName} (${ctx.userRole})${ctx.businessName ? ` â€” negocio: "${ctx.businessName}"` : ''}
HOY: ${todayFormatted}
AÃ‘O ACTUAL: ${currentYear}
SPRINT ACTIVO: ${ctx.activeCycleName ?? 'ninguno'}

REGLAS PARA MOSTRAR FECHAS EN TUS RESPUESTAS (OBLIGATORIO):
- Fecha de hoy (${ctx.today}) â†’ "hoy"
- MaÃ±ana â†’ "maÃ±ana"
- Esta semana (misma semana calendario) â†’ solo el dÃ­a ("el jueves", "el lunes")
- La semana que viene â†’ "el jueves que viene" / "el lunes de la semana que viene"
- Este mes â†’ "el jueves 22" (sin aÃ±o)
- El mes que viene â†’ "el lunes 3 de junio" (sin aÃ±o)
- Solo incluir el aÃ±o si es DIFERENTE a ${currentYear}
- NUNCA mostrar fechas en formato ISO (YYYY-MM-DD ni DD/MM/YYYY)
- Si el usuario pregunta por esta semana o este mes â†’ NUNCA mencionar el aÃ±o

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
- KANBAN (/dashboard/tareas): Tablero con columnas Backlog â†’ Por hacer â†’ En progreso â†’ En revisiÃ³n â†’ Finalizado â†’ Bloqueada. Drag & drop entre columnas. SelecciÃ³n mÃºltiple. Filtros por prioridad, sector y bÃºsqueda. Tabs: Todas | Backlog | [Sprint activo] | Otros sprints â–¾.
- AGENDA (/dashboard/tareas/agenda): Vista diaria inteligente estilo Toki. Secciones por urgencia: Foco del dÃ­a (top 3 por score automÃ¡tico), Vencidas, Hoy con hora, Para hoy, Esta semana, PrÃ³ximamente, Sin fecha, Completadas. Click en el cÃ­rculo de una tarea abre menÃº de cambio de estado.
- CALENDARIO (/dashboard/tareas/calendario): Vista mensual/semanal/lista con FullCalendar. Drag & drop para cambiar fechas. Las tareas recurrentes muestran fechas futuras como "fantasmas".
- CICLOS / PLANIFICACIÃ“N (/dashboard/planificacion): Sprints o perÃ­odos de trabajo. Estados: planificaciÃ³n â†’ activo â†’ completado â†’ cerrado. Solo puede haber 1 ciclo activo a la vez. Las tareas se asocian a un ciclo. Para crear desde el chat: "Crear planificaciÃ³n: [descripciÃ³n]".
- OBJETIVOS (/dashboard/planificacion/objetivos): Metas estratÃ©gicas de alto nivel (OKRs o Ã©picas). Muestran progreso 0â€“100% segÃºn tareas completadas. Las tareas se asocian a un objetivo. Para crear desde el chat: "Crear objetivo: [descripciÃ³n]".
- EQUIPO (/dashboard/equipo): GestiÃ³n de miembros del negocio. Roles jerÃ¡rquicos: superadmin > admin > responsable > miembro > viewer. TambiÃ©n permite crear roles personalizados con permisos granulares.
- SECTORES (/dashboard/sectores): Locales, departamentos o ubicaciones del negocio. Las tareas pueden pertenecer a un sector.
- REPORTES (/dashboard/reportes): SecciÃ³n en desarrollo.
- FACTURACIÃ“N (/dashboard/billing): Planes disponibles (free/basic/pro/enterprise), estado de suscripciÃ³n activa, historial de facturas y pagos vÃ­a MercadoPago.
- CONFIGURACIÃ“N (/dashboard/config): Datos del negocio, perfil de usuario, notificaciones push y email.
- ASISTENTE IA (botÃ³n flotante abajo a la derecha âœ¨): Este chat. Desde el chat podÃ©s: crear tareas escribiendo "Crear tarea: [descripciÃ³n]", crear planificaciones escribiendo "Crear planificaciÃ³n: [descripciÃ³n]", crear objetivos escribiendo "Crear objetivo: [descripciÃ³n]", o usar el ðŸŽ¤ para dictar tareas por voz.
- PRIORIDADES: urgent (rojo, bloquea todo) > high (naranja, importante) > medium (azul, normal) > low (verde, cuando haya tiempo).
- ESTADOS DE TAREA: backlog (sin fecha) | por hacer (todo) | en progreso (in_progress) | en revisiÃ³n (in_review) | finalizado (done) | bloqueada (blocked).
- TAREAS RECURRENTES: una tarea puede repetirse diaria, semanal o mensualmente. Al completarla, el sistema crea automÃ¡ticamente la siguiente ocurrencia.

PodÃ©s ayudar con:
- CONSULTAS sobre tareas: quÃ© estÃ¡ vencido, quÃ© vence esta semana, quÃ© tiene asignado alguien, tareas por prioridad/estado, etc.
- ORIENTACIÃ“N del sistema: explicar para quÃ© sirve cada secciÃ³n y cÃ³mo usarla
- RESÃšMENES: estado general del trabajo, carga por persona, anÃ¡lisis de prioridades
- SUGERENCIAS: buenas prÃ¡cticas de gestiÃ³n, cÃ³mo organizar el trabajo
- Si el usuario quiere CREAR TAREAS sueltas, informale que puede escribir en el chat "Crear tarea: [descripciÃ³n]" para que el sistema las extraiga automÃ¡ticamente, o usar el micrÃ³fono ðŸŽ¤ para dictarlas por voz
- Si el usuario quiere crear una planificaciÃ³n pero NO da suficiente detalle (ej: "quiero planificar algo", "crear un sprint", "hacer una planificaciÃ³n"), PREGUNTALE primero: "Â¿QuÃ© querÃ©s planificar? Dame una descripciÃ³n del proyecto u objetivo."
- Si el usuario quiere crear un objetivo pero NO da suficiente detalle, PREGUNTALE: "Â¿CuÃ¡l es la meta que querÃ©s lograr? Dame mÃ¡s detalles para poder crear el objetivo."
- Cuando el usuario dÃ© una descripciÃ³n clara, decile exactamente cÃ³mo activar la creaciÃ³n: "EscribÃ­: Crear planificaciÃ³n: [su descripciÃ³n]" o "Crear objetivo: [su descripciÃ³n]" â€” citando el formato textual para que lo envÃ­e
- Si ya escribiÃ³ "Crear planificaciÃ³n: X" o "Crear objetivo: X", el sistema lo procesa automÃ¡ticamente

Reglas:
- RespondÃ© en espaÃ±ol, de forma concisa y clara
- UsÃ¡ los datos reales de las tareas para responder consultas especÃ­ficas
- No inventÃ©s datos que no tenÃ©s
- Si te preguntan por algo que no estÃ¡ en los datos, decilo claramente`;
}

export async function chatWithAssistant(
  messages: AssistantMessage[],
  ctx: AssistantContext,
): Promise<AssistantResponse> {
  const systemPrompt = buildSystemPrompt(ctx);
  const { message } = await chatWithRotation(systemPrompt, messages);
  return { message: message || 'No pude generar una respuesta.' };
}
