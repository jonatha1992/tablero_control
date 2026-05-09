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
        description: 'Resumen de tareas activas, completadas, bloqueadas y urgentes del equipo. Se actualiza en tiempo real.',
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
        description: 'Tablero con columnas por estado: Backlog, Pendiente, En progreso, En revisión, Hecho y Bloqueado. Arrastrá y soltá para cambiar el estado. Podés filtrar por proyecto, prioridad o miembro.',
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
        description: 'Eventos del calendario del negocio: reuniones, hitos y recordatorios que no son tareas de trabajo.',
      },
      {
        title: 'Crear tarea con IA',
        description: 'Hacé clic en el botón ✨ (abajo a la derecha) y dictá una tarea por voz o escribila en texto libre. La IA extrae título, prioridad, fecha, asignados y etiquetas automáticamente.',
      },
      {
        title: 'Sprint tabs',
        description: 'Barra secundaria sobre el kanban para filtrar por ciclo: Todas | Backlog | [Ciclo activo] | Otros. El ciclo activo se destaca con un punto verde.',
      },
    ],
  },
  {
    id: 'planificacion',
    title: 'Planificación',
    emoji: '📅',
    subsections: [
      {
        title: 'Períodos (Ciclos)',
        description: 'Sprints de trabajo con fecha de inicio y fin. Estados: Planificación → Activo → Completado → Cerrado. Solo puede haber un ciclo activo a la vez. Las tareas se asocian a un ciclo desde el formulario de tarea.',
      },
      {
        title: 'Objetivos',
        description: 'Metas de alto nivel (épicas/OKRs) con progreso del 0 al 100%. Podés vincular tareas a un objetivo para ver el avance. Los objetivos pueden estar activos, completados o archivados.',
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
        description: 'Lista de todos los usuarios de la empresa. Podés invitar nuevos miembros por email o generar un link de invitación reutilizable con fecha de vencimiento.',
      },
      {
        title: 'Sectores',
        description: 'Locales, sucursales o áreas de la empresa. Cada tarea puede pertenecer a un sector. Los responsables de sector tienen permisos especiales en sus tareas.',
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
    ],
  },
  {
    id: 'facturacion',
    title: 'Facturación',
    emoji: '💳',
    subsections: [
      {
        title: 'Plan actual',
        description: 'Mostrá el plan contratado (Free, Basic, Pro, Enterprise) con los límites de usuarios, sectores y proyectos.',
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
        title: 'Datos de la empresa',
        description: 'Nombre, logo, zona horaria y configuración general de la cuenta.',
      },
      {
        title: 'Notificaciones',
        description: 'Preferencias de notificaciones push y por email: asignaciones, menciones, alertas de agentes.',
      },
      {
        title: 'Perfil personal',
        description: 'Avatar, nombre, email y preferencias de idioma y tema (claro/oscuro).',
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
