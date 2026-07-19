'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startOnboardingTour } from '@/components/layout/onboarding-tour';

interface Section {
  id: string;
  title: string;
  emoji: string;
  subsections: { title: string; description: string }[];
}

const SECTIONS: Section[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    emoji: '📊',
    subsections: [
      {
        title: 'Métricas principales',
        description: 'Resumen de tareas no finalizadas, completadas, bloqueadas y urgentes del equipo. Incluye tareas en Backlog y tareas programadas para fechas futuras. Para ver solo lo accionable hoy, usá la vista Agenda.',
      },
      {
        title: 'Actividad reciente',
        description: 'Últimas acciones realizadas por los miembros: tareas creadas, movidas o completadas.',
      },
    ],
  },
  {
    id: 'tareas',
    title: 'Tareas',
    emoji: '✅',
    subsections: [
      {
        title: 'Kanban',
        description: 'Tablero con columnas por estado: Backlog, Pendiente, En progreso, En revisión, Hecho y Bloqueado. Arrastrá y soltá para cambiar el estado. Podés filtrar por tablero (si tenés varios), prioridad o miembro.',
      },
      {
        title: 'Agenda',
        description: 'Vista diaria inteligente que agrupa tus tareas en secciones: Foco del día (top 3), Vencidas, Hoy con hora, Para hoy, Esta semana, Próximamente y Sin fecha. Se actualiza automáticamente cada minuto.',
      },
      {
        title: 'Calendario',
        description: 'Vista mensual/semanal/lista con todas las tareas que tienen fecha. Podés arrastrar tareas para cambiar su fecha directamente desde el calendario.',
      },
      {
        title: 'Cronograma',
        description: 'Vista Gantt que muestra la duración y dependencias de las tareas en el tiempo. Útil para planificar proyectos largos.',
      },
      {
        title: 'Eventos',
        description: 'Eventos del calendario del espacio: reuniones, hitos y recordatorios que no son tareas de trabajo.',
      },
      {
        title: 'Crear tarea con IA',
        description: 'Hacé clic en el botón ✨ (abajo a la derecha) y dictá una tarea por voz o escribila en texto libre. La IA extrae título, prioridad, fecha, asignados y etiquetas automáticamente.',
      },
      {
        title: 'Sprint tabs',
        description: 'Barra secundaria sobre el kanban: Todas | Backlog | [Ciclo activo] | Otros. El tab "Backlog" muestra tareas sin período/sprint asignado (de cualquier estado), no solo las de la columna Backlog. Para filtrar por estado, usá las columnas del tablero o los filtros del kanban.',
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
        description: 'Campo opcional al crear o editar una tarea. Podés dejarlo vacío o usar valores desde 0 h en adelante (incrementos de 0,25 h). Sirve para el registro de tiempo y la vista de cronograma.',
      },
    ],
  },
  {
    id: 'planificacion',
    title: 'Planificación',
    emoji: '📅',
    subsections: [
      {
        title: '¿Qué es un Período?',
        description: 'Un período es un bloque de tiempo con nombre, fecha de inicio y fecha de fin. Sirve para agrupar qué tareas vas a trabajar en esa franja (una semana, una quincena, un mes). Es equivalente a un "sprint" en metodologías ágiles.',
      },
      {
        title: 'Flujo de un Período paso a paso',
        description: '1. Creás el período (queda en "Planificación"). 2. Asignás tareas al período desde el Kanban o desde el detalle de cada tarea. 3. Cuando empieza el trabajo, hacés clic en "Iniciar" → pasa a "Activo". El período activo aparece como tab verde en el Kanban. 4. Al terminar, hacés clic en "Completar". Solo puede haber UN período activo a la vez — si intentás iniciar otro, el sistema te avisa.',
      },
      {
        title: 'Cómo asignar tareas a un período',
        description: 'Opción A: en el Kanban, hacé clic en el tab del período activo y creá una nueva tarea — queda asignada automáticamente. Opción B: abrí una tarea existente y elegí el período en el campo "Período/Sprint". Opción C: en el tab "Backlog" del Kanban aparecen todas las tareas sin período asignado.',
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
        description: 'Abrí el detalle de cualquier tarea y buscá el campo "Objetivo". Seleccioná el objetivo correspondiente. La tarea pasa a contar para el progreso del objetivo automáticamente.',
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
    emoji: '👥',
    subsections: [
      {
        title: 'Miembros',
        description: 'Lista de todos los usuarios de la empresa. Podés invitar nuevos miembros por email o generar un link de invitación reutilizable con fecha de vencimiento y límite de usos.',
      },
      {
        title: 'Link de invitación — cómo funciona',
        description: 'El admin genera un link desde Equipo → Invitar. Quien lo abre ve una pantalla para unirse al equipo. Puede crear cuenta con email, iniciar sesión si ya tiene una, o usar "Continuar con Google". Importante: al entrar por link de invitación no se crea un espacio nuevo; el usuario queda en el equipo que lo invitó. Después de autenticarse, debe pulsar "Unirme al equipo" para completar el alta. Verás el mensaje: "No vas a crear un espacio nuevo; te sumás al equipo de …".',
      },
      {
        title: 'Link de invitación — espacio propio después',
        description: 'Si más adelante querés gestionar tu propio equipo (aparte del que te invitaron), andá a Configuración → Mi perfil → "Armar tu espacio". También podés usar el menú del nombre en la barra superior: "Armar tu espacio" te lleva a Configuración. No hace falta crear otro usuario.',
      },
      {
        title: 'Link de invitación — problemas frecuentes',
        description: 'Si Google queda cargando: probá cerrar la pestaña y volver a abrir el link, o usá email/contraseña. Si dice que el link expiró o no tiene usos: pedile al admin un link nuevo. Si ya pertenecés a otro equipo, el sistema no permite unirte a uno distinto con el mismo usuario.',
      },
      {
        title: 'Sedes',
        description: 'Sucursales, locales o áreas del espacio. Cada tarea puede pertenecer a una sede. Los responsables de sede tienen permisos especiales en sus tareas.',
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
    emoji: '📈',
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
    emoji: '💳',
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
    emoji: '⚙️',
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
    emoji: '🔔',
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

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-3 font-semibold text-base">
          <span>{section.emoji}</span>
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
            <Play className="h-4 w-4" />
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

        <div className="flex justify-center gap-4 pt-2">
          <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
            Términos y condiciones
          </a>
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
            Política de privacidad
          </a>
        </div>
      </div>
    </div>
  );
}
