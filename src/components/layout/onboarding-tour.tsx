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
    element: '#tour-nav-tareas',
    popover: {
      title: '✅ Tablero Kanban',
      description: 'Gestioná tareas en columnas (Pendiente → En progreso → Revisión → Hecho). Arrastrá y soltá para mover. Incluye vistas de calendario y cronograma.',
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
    element: '#tour-nav-planificacion',
    popover: {
      title: '📅 Planificación',
      description: 'Organizá el trabajo en ciclos con fechas de inicio y fin, y definí objetivos de negocio vinculados a tareas. Cada ciclo pasa por planificación, activo, completado y cerrado.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-equipo',
    popover: {
      title: '👥 Equipo',
      description: 'Invitá miembros por email o link. Asigná roles (admin, responsable, miembro, viewer) con permisos granulares. Gestioná sectores desde aquí.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-reportes',
    popover: {
      title: '📊 Reportes',
      description: 'Visualizá el rendimiento del equipo con gráficos de tareas por estado, prioridad y miembro. Identificá cuellos de botella y tendencias.',
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
      const availableSteps = STEPS.filter(
        (s) => !s.element || document.querySelector(s.element)
      );
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
        steps: availableSteps,
      });

      setTimeout(() => driverObj?.drive(), 800);
    });

    return () => {
      driverObj?.destroy();
    };
  }, [user, loading, pathname]);

  return null;
}
