'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Play,
  LayoutDashboard,
  CheckSquare,
  Layers,
  Users,
  BarChart2,
  CreditCard,
  Settings,
  Bell,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startOnboardingTour } from '@/components/layout/onboarding-tour';
import { NAV_ICON_COLORS, SEMANTIC_ICON } from '@/lib/constants/ui-icon-colors';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
  icon: LucideIcon;
  iconClass: string;
  subsections: { title: string; description: string }[];
}

const SECTIONS: Section[] = [
  {
    id: 'dashboard',
    title: 'Inicio',
    icon: LayoutDashboard,
    iconClass: NAV_ICON_COLORS.dashboard,
    subsections: [
      {
        title: 'Métricas principales',
        description: 'Resumen de tareas no finalizadas, completadas, bloqueadas y urgentes del equipo. Incluye tareas en Backlog y tareas programadas para fechas futuras. Para ver solo lo accionable hoy, usá la vista Agenda.',
      },
      {
        title: 'Eventos pendientes',
        description: 'Card KPI en el dashboard (mismo estilo que Tareas activas). Muestra cuántos eventos aún no terminaron. Click abre la pestaña Eventos del Calendario.',
      },
      {
        title: 'Mis tareas',
        description: 'Tus tareas asignadas que hay que atender hoy (vencidas, para hoy o sin fecha), ordenadas por prioridad. "Ver agenda" abre la vista completa.',
      },
      {
        title: 'Sprints activos',
        description: 'Un bloque por cada sprint en curso (puede haber uno por proyecto) con el porcentaje de tareas finalizadas y los días que quedan.',
      },
      {
        title: 'Progreso del equipo',
        description: 'Gráficos de burndown de los últimos 7 días, tendencia semanal y distribución de tareas por estado.',
      },
    ],
  },
  {
    id: 'tareas',
    title: 'Tareas',
    icon: CheckSquare,
    iconClass: NAV_ICON_COLORS.tareas,
    subsections: [
      {
        title: 'Kanban',
        description: 'Tablero con columnas por estado: Backlog, Pendiente, En progreso, En revisión, Hecho y Bloqueado. Arrastrá y soltá para cambiar el estado. Si entraste desde un proyecto, las tareas nuevas nacen ahí. Backlog y sprint son el mismo tablero (Scrumban).',
      },
      {
        title: 'Proyectos',
        description: 'Ítem principal del menú. Cada proyecto es un sistema o producto que desarrolla el equipo: entrás y trabajás con el mismo Kanban. Ver todo muestra las tareas de todos. Podés archivar y restaurar. Fecha límite solo si ese proyecto se cierra.',
      },
      {
        title: 'Roadmap',
        description: 'Vista Gantt que muestra la duración y dependencias de las tareas en el tiempo. Útil para planificar releases y proyectos largos.',
      },
      {
        title: 'Crear tarea con IA',
        description: 'Hacé clic en el botón ✨ (abajo a la derecha) y dictá una tarea por voz o escribila en texto libre. La IA extrae título, prioridad, fecha, asignados y etiquetas automáticamente. También puede crear eventos (examen, reunión) cuando lo pedís o cuando detecta que no es una tarea.',
      },
      {
        title: 'Sprint tabs y Kanban inteligente',
        description: 'Barra sobre el kanban: Todas | Backlog | [Período activo] | Otros. El tab Backlog muestra solo tareas con estado Backlog (cola de ideas, no cuentan en Agenda/KPIs). El + de cada columna crea la tarea en ese estado. En Backlog no pone fecha. Si hay un período activo, "Por hacer" y el resto heredan ese período. Las cards muestran el objetivo y la sede si están vinculados.',
      },
      {
        title: 'Checklist',
        description: 'Cada tarea puede tener una lista de pasos con casillas. El progreso se ve en el detalle de la tarea. Si quedan items pendientes y la marcás como Hecho, el sistema te pide confirmación antes de cerrarla. En tareas repetitivas, la próxima ocurrencia hereda el mismo checklist con todos los ítems sin marcar.',
      },
      {
        title: 'Tareas repetitivas',
        description: 'Al crear una tarea, activá "Tarea repetitiva" y elegí frecuencia (diaria, semanal, quincenal o mensual). Cuando la marcás Finalizado, el sistema crea automáticamente la siguiente ocurrencia con la nueva fecha. No hace falta crearla a mano. Si reabrís una tarea ya finalizada (por ejemplo, la movés a En progreso para revisar algo) y la volvés a finalizar, no se duplica la próxima ocurrencia.',
      },
      {
        title: 'Horas estimadas',
        description: 'Campo opcional al crear o editar una tarea. Usá horas y minutos (o dejalo vacío). Sirve para el registro de tiempo y la vista de cronograma.',
      },
    ],
  },
  {
    id: 'calendario',
    title: 'Calendario',
    icon: CalendarDays,
    iconClass: NAV_ICON_COLORS.planificacion,
    subsections: [
      {
        title: 'Una sección, tres pestañas',
        description: 'Todo lo que tiene fecha está en Calendario. Arriba elegís la vista: Mes, Agenda o Eventos. El botón "Nuevo evento" está disponible en las tres.',
      },
      {
        title: 'Mes',
        description: 'Vista mensual/semanal/lista con tareas con fecha y eventos del equipo. Podés arrastrar tareas para cambiar su fecha o hacer clic en un día para crear una tarea.',
      },
      {
        title: 'Agenda',
        description: 'Vista diaria inteligente que agrupa tus tareas en secciones: Foco del día (top 3), Vencidas, Hoy con hora, Para hoy, Esta semana, Próximamente y Sin fecha. Se actualiza automáticamente cada minuto.',
      },
      {
        title: 'Eventos',
        description: 'Reuniones, demos, releases e hitos que no son tareas de trabajo. Se crean desde el botón "Nuevo evento" o desde el asistente IA. Reciben aviso por notificación y email.',
      },
    ],
  },
  {
    id: 'planificacion',
    title: 'Planificación',
    icon: Layers,
    iconClass: NAV_ICON_COLORS.planificacion,
    subsections: [
      {
        title: 'Cómo se organiza el trabajo',
        description: 'Proyecto = el contenedor (entrás y trabajás). Tarea = el paso (requerimiento, rutina, escrito). Sprint = ventana de tiempo de ese proyecto. Épica = funcionalidad grande que agrupa tareas. Backlog = columna, no otro módulo. Kanban y Scrum se usan juntos en el mismo proyecto.',
      },
      {
        title: '¿Qué es un Período?',
        description: 'Un período es un bloque de tiempo con nombre, fecha de inicio y fecha de fin. Sirve para agrupar qué tareas vas a trabajar en esa franja (una semana, una quincena, un mes). Es equivalente a un "sprint" en metodologías ágiles.',
      },
      {
        title: 'Flujo de un Período paso a paso',
        description: '1. Creás el período (queda en "Planificación"). 2. Asignás tareas al período al crearlas (tab del período o campo Período) o desde el detalle de la tarea. 3. Cuando empieza el trabajo, hacés clic en "Iniciar" → pasa a "Activo". El período activo aparece como tab verde en el Kanban. 4. Al terminar, hacés clic en "Completar". Solo puede haber UN período activo a la vez — si intentás iniciar otro, el sistema te avisa.',
      },
      {
        title: 'Cómo asignar tareas a un período',
        description: 'Opción A: en el Kanban, abrí el tab del período activo y creá una tarea — queda asignada a ese período. Opción B: en el detalle de la tarea, campo Período. El tab Backlog no es “sin período”: son tareas en estado Backlog.',
      },
      {
        title: '¿Qué es un Objetivo?',
        description: 'Un objetivo es una meta grande que puede durar semanas o meses. Por ejemplo: "Apertura sucursal Palermo" o "Lanzamiento v2 del producto". Es equivalente a una "épica" o un "OKR". No tiene fechas de sprint — es una meta de alto nivel.',
      },
      {
        title: 'Progreso automático de Objetivos',
        description: 'El progreso de un objetivo se calcula solo: (tareas con estado "Hecho" ÷ total de tareas vinculadas) × 100. No hay que actualizar el porcentaje manualmente. Si tenés 10 tareas en un objetivo y 4 están en "Hecho", el progreso es 40%.',
      },
      {
        title: 'Cómo vincular tareas a un Objetivo',
        description: 'Al crear la tarea elegí el objetivo, o abrí el detalle → Editar → campo Objetivo. También podés asignar tareas existentes desde el detalle del objetivo. El progreso se actualiza solo.',
      },
      {
        title: 'Estados de un Objetivo',
        description: '"Activo" → en curso. "Completado" → meta alcanzada (botón "Completar" en la card). "Archivado" → descartado o pausado indefinidamente. Los objetivos completados y archivados se muestran en tabs separados para no saturar la vista principal.',
      },
      {
        title: 'Diferencia entre Período y Objetivo',
        description: 'Período = cuándo. Objetivo = qué meta perseguís. Una tarea puede pertenecer a un período Y a un objetivo al mismo tiempo. Ejemplo: la tarea "Diseñar logo" puede estar en el período "Semana del 9 al 16" y también vincular al objetivo "Branding 2026".',
      },
    ],
  },
  {
    id: 'equipo',
    title: 'Equipo',
    icon: Users,
    iconClass: NAV_ICON_COLORS.equipo,
    subsections: [
      {
        title: 'Miembros',
        description: 'Lista de todos los usuarios del espacio. Desde Equipo hay dos botones: "Invitar usuario" (nombre, correo, rol y sectores; envía correo o genera link de un solo uso) y "Link de invitación" (link compartible con rol, sectores, vencimiento y límite de usos, o correo personal de un solo uso).',
      },
      {
        title: 'Link de invitación — cómo funciona',
        description: 'Quien abre el link `/i/…` ve la pantalla para unirse al equipo. Si no tiene cuenta, completa nombre + contraseña (sin correo: el sistema genera un usuario interno) y queda dentro en un solo paso. También puede usar "Continuar con Google" o iniciar sesión y después pulsar "Unirme al equipo". Importante: no se crea un espacio nuevo; el usuario queda en el equipo que lo invitó. Verás el mensaje: "No vas a crear un espacio nuevo; te sumás al equipo de …".',
      },
      {
        title: 'Link de invitación — espacio propio después',
        description: 'Si más adelante querés gestionar tu propio equipo (aparte del que te invitaron), andá a Configuración → Mi perfil → "Armar tu espacio". También podés usar el menú del nombre en la barra superior: "Armar tu espacio" te lleva a Configuración. No hace falta crear otro usuario.',
      },
      {
        title: 'Link de invitación — problemas frecuentes',
        description: 'Si Google queda cargando: cerrá la pestaña, volvé a abrir el link, o usá nombre + contraseña. Si el link expiró o se agotaron los usos: pedile al admin uno nuevo. Login futuro de invitados sin correo: nombre + contraseña (no hace falta email). Si ya pertenecés a otro equipo, el sistema no permite unirte a uno distinto con el mismo usuario.',
      },
      {
        title: 'Roles',
        description: 'Roles personalizados con permisos granulares (tareas, reportes, facturación, etc.). Los roles base son: admin, responsable, miembro y viewer.',
      },
    ],
  },
  {
    id: 'reportes',
    title: 'Reportes',
    icon: BarChart2,
    iconClass: NAV_ICON_COLORS.reportes,
    subsections: [
      {
        title: 'Rendimiento del equipo',
        description: 'Gráficos de tareas por estado, prioridad y miembro. Identificá cuellos de botella y miembros sobrecargados.',
      },
      {
        title: 'Exportar a Excel',
        description:
          'Usá Exportar Excel (arriba a la derecha) para descargar un archivo .xlsx con varias hojas: resumen, actividad, distribuciones, equipo y tareas. Elegí Semana, Mes o Trimestre para filtrar la hoja Tareas. Abrilo directamente en Microsoft Excel o Google Sheets.',
      },
    ],
  },
  {
    id: 'facturacion',
    title: 'Facturación',
    icon: CreditCard,
    iconClass: NAV_ICON_COLORS.billing,
    subsections: [
      {
        title: 'Plan actual',
        description: 'Mostrá el plan contratado (Free, Basic, Pro, Enterprise) con los límites de usuarios, sedes y tableros.',
      },
      {
        title: 'Historial de pagos',
        description: 'Facturas anteriores con fecha, monto y estado. Podés descargar cada factura en PDF.',
      },
      {
        title: 'Cambio de plan',
        description: 'Actualizá o bajá de plan en cualquier momento. Los cambios aplican al próximo período de facturación.',
      },
    ],
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    icon: Settings,
    iconClass: NAV_ICON_COLORS.config,
    subsections: [
      {
        title: 'Datos del espacio',
        description: 'Nombre, logo, zona horaria y configuración general del espacio.',
      },
      {
        title: 'Notificaciones',
        description: 'Preferencias de notificaciones push y por email: asignaciones, menciones, alertas de agentes.',
      },
      {
        title: 'Perfil personal',
        description: 'Avatar, nombre, email y preferencias de idioma y tema (claro/oscuro).',
      },
      {
        title: 'Instalar app (PWA)',
        description: 'En Configuración hay una tarjeta para instalar Tablero como app. En el header / home también está el botón Instalar. En iPhone usá Safari → Compartir → Agregar a Inicio.',
      },
      {
        title: 'Actualizar app / cache',
        description: 'Después de un deploy en Vercel, si ves una versión vieja (el pie del sidebar no coincide con /version.json), andá a Configuración → Instalación → "Actualizar app (limpiar cache)". Eso borra el cache del Service Worker y recarga. Instalar ≠ Actualizar: instalar agrega la app; actualizar fuerza la versión nueva.',
      },
      {
        title: 'Armar tu espacio',
        description: 'Si entraste por invitación y solo trabajás en el equipo de otra persona, verás una tarjeta "Armar tu espacio" arriba de tu perfil. Ahí podés crear tu propio espacio sin dejar el equipo al que te invitaron. Después cambiás de contexto con el selector en la barra superior.',
      },
      {
        title: 'Selector de espacio (barra superior)',
        description: 'Muestra el nombre del espacio activo. Desde el menú podés cambiar entre espacios donde tenés membresía. Si aún no tenés espacio propio, la opción "Armar tu espacio" abre Configuración. Si ya sos dueño de al menos uno, "Crear otro espacio" crea un espacio adicional.',
      },
    ],
  },
  {
    id: 'notificaciones-push',
    title: 'Notificaciones push',
    icon: Bell,
    iconClass: SEMANTIC_ICON.notification,
    subsections: [
      {
        title: '¿Qué son las notificaciones push?',
        description: 'Son alertas que aparecen en tu sistema operativo, incluso con la pestaña cerrada. Se usan para avisar sobre tareas asignadas, menciones y cambios de estado.',
      },
      {
        title: 'Compatibilidad con navegadores',
        description: 'Chrome y Edge: funcionan sin configuración adicional. Brave: funciona si activás "Usar servicios de Google para push" en Configuración → Privacidad. Firefox y Safari: no compatibles con el sistema de notificaciones actual.',
      },
      {
        title: 'Múltiples dispositivos',
        description: 'Cada dispositivo donde iniciás sesión y activás las notificaciones queda registrado por separado. Si usás el dashboard en la PC y en el celular, las alertas llegan a ambos simultáneamente.',
      },
      {
        title: 'Cómo activar las notificaciones',
        description: 'Ir a Configuración → Notificaciones → Activar notificaciones push. El navegador pedirá permiso. Si lo rechazaste antes, debés habilitarlo manualmente desde el ícono de candado en la barra de direcciones.',
      },
      {
        title: 'Las notificaciones no llegan',
        description: 'Verificá: (1) que el navegador tenga permiso concedido, (2) que no estés en modo incógnito, (3) que tengas conexión a internet al momento de activarlas. Si el problema persiste, desactivá y volvé a activar desde Configuración.',
      },
    ],
  },
];

function AccordionSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-3 font-semibold text-base">
          <Icon className={cn('h-5 w-5 shrink-0', section.iconClass)} />
          {section.title}
        </span>
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        }
      </button>
      {open && (
        <div className="border-t divide-y">
          {section.subsections.map((sub) => (
            <div key={sub.title} className="px-5 py-3">
              <p className="text-sm font-medium mb-0.5">{sub.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{sub.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AyudaPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Centro de ayuda</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Guía de referencia rápida para cada sección de la aplicación.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={startOnboardingTour}
            className="shrink-0 flex items-center gap-2"
          >
            <Play className={cn('h-4 w-4', NAV_ICON_COLORS.ayuda)} />
            Ver tour
          </Button>
        </div>

        <div className="space-y-2">
          {SECTIONS.map((section) => (
            <AccordionSection key={section.id} section={section} />
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4">
          ¿Encontraste un problema? Contactá al soporte desde el chat del asistente IA.
        </p>
      </div>
    </div>
  );
}
