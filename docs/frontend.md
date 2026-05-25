# Frontend — Stores, Layout, Onboarding

## Stores Zustand (`src/stores/`)

Solo estado UI efímero — no persistir datos de servidor acá.

### `kanban-ui.store.ts`
- drag state
- modales: `create`, `detail`, `dictate`
- `selectMode` — selección múltiple de cards
- filtros: `searchQuery`, `priority`, `locationId`
- columnas activas

### `scrum-ui.store.ts`
- `selectedSprintId: string | null`
- `viewMode: 'board' | 'backlog'`

**Regla:** fuente de verdad compartida entre `page.tsx` y `CreateTaskModal`. NO crear estado local para filtro de sprint.

### `team-ui.store.ts`
- búsqueda de miembros
- filtros de rol/ubicación
- modal de invitación

## React Query (`src/hooks/`)

- Queries: `src/hooks/queries/` — query keys co-localizados en el archivo
- Mutations: `src/hooks/mutations/`
- Funciones HTTP: `src/lib/api/` (e.g. `tasksApi`, `membersApi`, `billingApi`)

## Layout del dashboard (`src/app/dashboard/layout.tsx`)

Layout principal `'use client'`. Contiene:

- **Sidebar** (`src/components/layout/sidebar.tsx`) — navegación colapsable. Cada item tiene `tourId` para el onboarding. Items: Dashboard, Tareas, Planificación, Equipo, Reportes, Facturación, Configuración, Ayuda.
- **Header** (`src/components/layout/header.tsx`) — título dinámico por ruta, buscador en `/dashboard/tareas`, botón `?` (→ `/dashboard/ayuda`), campana de notificaciones, `BusinessSwitcher`, avatar + rol, logout.
- **FAB IA** (`id="tour-fab"`) — botón flotante bottom-right → abre `AiAssistantPanel`. Punto de entrada al asistente IA y al dictado de tareas.
- **OnboardingTour** — componente invisible que gestiona el tour con driver.js.

## Onboarding Tour (`src/components/layout/onboarding-tour.tsx`)

Tour interactivo con driver.js.

**Auto-inicio:** primera vez que el usuario visita `/dashboard`. Persiste en `localStorage` con key `tour_completed_{userId}`.

**Trigger manual desde cualquier lugar:**
```ts
import { startOnboardingTour } from '@/components/layout/onboarding-tour';
startOnboardingTour();
// dispara window.dispatchEvent(new CustomEvent('start-onboarding-tour'))
// ignora el estado de localStorage
```

**Pasos (por orden):** Dashboard → Tareas (Kanban) → FAB IA → Planificación → Equipo → Reportes → Facturación → Configuración → Ayuda.

Cada paso usa `element: '#tour-nav-xxx'`. Si el elemento no existe en el DOM, el paso se omite automáticamente.

**Página de ayuda** (`src/app/dashboard/ayuda/page.tsx`): acordeón estático (no usa `@radix-ui/react-accordion` — no está instalado). El botón "Ver tour" llama a `startOnboardingTour()`.

## Rutas de la app

```
src/app/
├── (auth)/           # login, register, forgot-password — sin sidebar
├── (superadmin)/     # panel TecnoFusión — superadmin-sidebar
│   └── superadmin/
│       ├── planes/
│       ├── businesses/
│       ├── users/
│       ├── subscriptions/
│       └── audit/
├── dashboard/        # layout 'use client' + ProtectedRoute + Sidebar + Header
│   ├── tareas/        # Kanban | Agenda | Calendario | Cronograma
│   │   ├── agenda/
│   │   ├── calendario/  # FullCalendar
│   │   └── cronograma/  # Gantt
│   ├── planificacion/
│   │   └── objetivos/
│   ├── equipo/
│   │   └── roles/
│   ├── sectores/
│   ├── reportes/
│   ├── billing/
│   ├── config/
│   └── ayuda/
└── i/[token]/        # flujo de invitación
```

## Flujo de invitación

`src/app/i/[token]/invite-client.tsx`: después de `accept.mutateAsync()` + `refreshProfile()`, **NO redirigir automáticamente**. Dejar que `accept.isSuccess` muestre CheckCircle + botón "Ir al dashboard". El usuario navega manualmente.

Ver decisions/004 para detalle de `locationIds` en BusinessInvite.
