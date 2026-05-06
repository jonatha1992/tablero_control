'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { usePathname } from 'next/navigation';
import 'driver.js/dist/driver.css';

const TOUR_KEY = (userId: string) => `tour_completed_${userId}`;

const STEPS = [
  {
    element: '#tour-nav-dashboard',
    popover: {
      title: '📊 Dashboard',
      description: 'Vista general con métricas clave: tareas activas, completadas, bloqueadas y urgentes.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-sectores',
    popover: {
      title: '🏢 Departamentos / Sectores',
      description: 'Organizá tu empresa en locales o sectores. Cada tarea puede asignarse a un sector específico.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-tareas',
    popover: {
      title: '✅ Tablero Kanban',
      description: 'Gestioná tareas en columnas (Pendiente → En progreso → Revisión → Hecho). Arrastrá y soltá para mover.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-fab',
    popover: {
      title: '➕ Crear tarea',
      description: 'Creá tareas con formulario o dictándolas por voz. La IA transcribe y extrae título, prioridad, fecha y asignados automáticamente.',
      side: 'left' as const,
    },
  },
  {
    element: '#tour-nav-ciclos',
    popover: {
      title: '⏱ Períodos / Ciclos',
      description: 'Organizá el trabajo en ciclos con fechas de inicio y fin. Cada ciclo pasa por planificación, activo, completado y cerrado.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-objetivos',
    popover: {
      title: '🎯 Objetivos',
      description: 'Definí metas de negocio y vinculalas a tareas. Seguí el progreso hacia cada objetivo de tu equipo.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-calendario',
    popover: {
      title: '📅 Calendario',
      description: 'Visualizá todas las tareas y eventos por fecha. Navegá por semana o mes para planificar el trabajo.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-cronograma',
    popover: {
      title: '📋 Cronograma',
      description: 'Vista Gantt de las tareas con sus fechas de inicio y vencimiento. Ideal para ver dependencias y plazos de un vistazo.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-equipo',
    popover: {
      title: '👥 Equipo',
      description: 'Invitá miembros por email o link. Asigná roles (admin, responsable, miembro, viewer) con permisos granulares.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-billing',
    popover: {
      title: '💳 Facturación',
      description: 'Gestioná tu plan y suscripción. Podés cambiar de plan o ver el historial de facturas aquí.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-config',
    popover: {
      title: '⚙️ Configuración',
      description: 'Ajustes del negocio: nombre, logo, zona horaria y preferencias generales de la cuenta.',
      side: 'right' as const,
    },
  },
];

export function OnboardingTour() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const started = useRef(false);

  useEffect(() => {
    if (loading || !user || started.current) return;
    if (pathname !== '/dashboard') return;

    const key = TOUR_KEY(user.id);
    if (localStorage.getItem(key)) return;

    started.current = true;

    let driverObj: ReturnType<typeof import('driver.js')['driver']> | null = null;

    import('driver.js').then(({ driver }) => {
      driverObj = driver({
        showProgress: true,
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '¡Entendido!',
        // onDestroyStarted prevents auto-close in driver.js v1.x —
        // must call destroy() explicitly to actually close the tour.
        onDestroyStarted: () => {
          localStorage.setItem(key, '1');
          driverObj?.destroy();
        },
        steps: STEPS,
      });

      setTimeout(() => driverObj?.drive(), 800);
    });

    return () => {
      driverObj?.destroy();
    };
  }, [user, loading, pathname]);

  return null;
}
