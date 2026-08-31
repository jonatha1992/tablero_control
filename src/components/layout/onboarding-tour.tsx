'use client';

import { useEffect, useRef, useCallback } from 'react';
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
      description: 'Gestioná tareas en columnas (Pendiente → En progreso → Revisión → Hecho). Arrastrá y soltá para mover. Incluye vistas de Agenda y Cronograma.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-eventos',
    popover: {
      title: '📅 Eventos',
      description: 'Lista de reuniones, exámenes e hitos del espacio. No son tareas: reciben aviso por notificación y email.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-fab',
    popover: {
      title: '✨ Asistente IA',
      description: 'Abrí el asistente para crear tareas por voz o texto. La IA transcribe y extrae título, prioridad, fecha y asignados automáticamente.',
      side: 'left' as const,
    },
  },
  {
    element: '#tour-nav-calendario',
    popover: {
      title: '📅 Calendario',
      description: 'Vista mensual/semanal de tareas con fecha y eventos del espacio. Arrastrá tareas para cambiar la fecha.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-planificacion',
    popover: {
      title: '🎯 Planificación',
      description: 'Períodos (sprints) y objetivos de negocio vinculados a tareas.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-sedes',
    popover: {
      title: '🏢 Sedes',
      description: 'Organizá sucursales, locales o áreas y vinculá cada tarea con su lugar de trabajo.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-equipo',
    popover: {
      title: '👥 Equipo',
      description: 'Invitá miembros por email o link y asigná roles con permisos granulares.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-reportes',
    popover: {
      title: '📊 Reportes',
      description: 'Visualizá el rendimiento del equipo con gráficos de tareas por estado, prioridad y miembro.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-billing',
    popover: {
      title: '💳 Facturación',
      description: 'Gestioná tu plan y suscripción. Podés cambiar de plan o ver el historial de facturas.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-config',
    popover: {
      title: '⚙️ Configuración',
      description: 'Ajustes de la empresa: nombre, logo, zona horaria y preferencias generales de la cuenta.',
      side: 'right' as const,
    },
  },
  {
    element: '#tour-nav-ayuda',
    popover: {
      title: '❓ Ayuda',
      description: 'Documentación de cada sección, preguntas frecuentes y acceso al tour en cualquier momento.',
      side: 'right' as const,
    },
  },
];

export function startOnboardingTour() {
  window.dispatchEvent(new CustomEvent('start-onboarding-tour'));
}

export function OnboardingTour() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const started = useRef(false);

  const runTour = useCallback(() => {
    if (!user) return;
    let driverObj: ReturnType<typeof import('driver.js')['driver']> | null = null;
    const key = TOUR_KEY(user.id);
    const skipForCollaborator = new Set(['#tour-nav-billing', '#tour-nav-equipo', '#tour-nav-sedes']);

    import('driver.js').then(({ driver }) => {
      const availableSteps = STEPS.filter((s) => {
        if (!user.isOwner && s.element && skipForCollaborator.has(s.element)) return false;
        return !s.element || document.querySelector(s.element);
      });
      driverObj = driver({
        showProgress: true,
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '¡Entendido!',
        onDestroyStarted: () => {
          localStorage.setItem(key, '1');
          driverObj?.destroy();
        },
        steps: availableSteps,
      });

      setTimeout(() => driverObj?.drive(), 300);
    });
  }, [user]);

  // Auto-start on first visit to /dashboard
  useEffect(() => {
    if (loading || !user || started.current) return;
    if (pathname !== '/dashboard') return;

    const key = TOUR_KEY(user.id);
    if (localStorage.getItem(key)) return;

    started.current = true;
    setTimeout(() => runTour(), 800);
  }, [user, loading, pathname, runTour]);

  // Manual trigger via custom event
  useEffect(() => {
    function handleStartTour() {
      runTour();
    }
    window.addEventListener('start-onboarding-tour', handleStartTour);
    return () => window.removeEventListener('start-onboarding-tour', handleStartTour);
  }, [runTour]);

  return null;
}
