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
        onDestroyStarted: () => {
          localStorage.setItem(key, '1');
        },
        steps: STEPS,
      });

      // Small delay so the DOM is fully painted
      setTimeout(() => driverObj?.drive(), 800);
    });

    return () => {
      driverObj?.destroy();
    };
  }, [user, loading, pathname]);

  return null;
}
