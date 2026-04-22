# Arquitectura — Tablero de Control

## Visión general

SaaS multi-tenant de gestión de tareas y proyectos. Arquitectura en capas diseñada para ser portable: cambiar el backend (Firebase → PostgreSQL) o el framework (Next.js → Remix) tiene impacto mínimo en el resto del código.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 + TypeScript strict |
| Estilos | Tailwind CSS 4 + Radix UI |
| Estado UI | Zustand 5 |
| Estado servidor | React Query 5 |
| Backend (Auth/Storage) | Firebase |
| Base de Datos (Core) | PostgreSQL + Prisma ORM |
| Almacenamiento archivos | Cloudinary |
| Tests | Vitest + Testing Library + Firebase Emulator |

---

## Capas y responsabilidades

```
components / pages
      ↓  (llama a)
hooks/queries + hooks/mutations     ← React Query (server state)
hooks/stores                        ← Zustand (UI state)
      ↓  (llama a)
services/                           ← lógica de negocio
      ↓  (llama a)
repositories/                       ← acceso a datos (Interfaces)
      ↓  (llama a)
repositories/prisma/                ← implementación principal (Prisma)
      ↓  (llama a)
Base de Datos (PostgreSQL)          ← persistencia física
```

**Regla de oro:** las capas externas importan de las internas, nunca al revés.

### Prohibiciones explícitas
- `repositories/` no importa de `services/`, `hooks/` ni `components/`
- `services/` no importa de `hooks/` ni `components/`
- `components/` no importa de `repositories/` directamente
- `stores/` solo importa tipos de dominio (nunca services ni repositories)

---

## Estructura de carpetas

```
src/
├── types/
│   ├── domain/          # Entidades de negocio (framework-agnostic)
│   │   ├── task.ts      # Task, TaskStatus, TaskPriority, TaskFilters
│   │   ├── user.ts      # User, UserRole, UserPreferences
│   │   ├── team.ts      # Team, TeamSettings
│   │   ├── location.ts  # Location, LocationStatus
│   │   ├── business.ts  # Business, BusinessSettings
│   │   ├── project.ts   # Project, ProjectStatus
│   │   ├── sprint.ts    # Sprint, SprintTask, DailyStandup
│   │   ├── report.ts    # Report, ReportMetrics
│   │   ├── alert.ts     # Alert, AlertType, AlertSeverity
│   │   ├── calendar.ts  # CalendarEvent, ReminderConfig
│   │   ├── agent.ts     # AgentConfig, AgentLog
│   │   └── widget.ts    # WidgetConfig, WidgetType
│   ├── dto/             # Contratos de entrada/salida entre capas
│   │   ├── task.dto.ts  # CreateTaskDTO, UpdateTaskDTO, MoveTaskDTO
│   │   ├── team.dto.ts  # InviteMemberDTO, UpdateMemberDTO
│   │   └── auth.dto.ts  # LoginDTO, RegisterDTO
│   ├── ui/              # Tipos solo relevantes para la interfaz
│   │   ├── kanban.ui.ts # KanbanDragState, KanbanUIFilters
│   │   └── forms.ui.ts  # TaskFormValues, UserFormValues
│   ├── api/
│   │   └── responses.ts # ApiResponse<T>, PaginatedResponse<T>
│   └── index.ts         # Re-exporta todo (compatibilidad)
│
├── lib/
│   ├── firebase/        # Drivers de infraestructura (no lógica de negocio)
│   │   ├── client.ts    # Inicialización cliente + emuladores
│   │   ├── admin.ts     # Admin SDK + verifyToken
│   │   ├── auth.ts      # login, register, logout, Google OAuth
│   │   ├── firestore.ts # CRUD genéricos: getById, getAll, create, update, remove
│   │   └── storage.ts   # uploadUserAvatar, uploadTaskAttachment
│   ├── cloudinary/      # Upload de archivos (server-side)
│   │   ├── config.ts    # Inicialización SDK
│   │   └── upload.ts    # uploadUserAvatar, uploadTaskAttachment, deleteFile
│   ├── utils/           # Funciones puras (sin estado, sin efectos)
│   │   ├── cn.ts        # cn() — Tailwind merge
│   │   ├── date.ts      # formatDate, formatDateTime, formatRelative
│   │   ├── format.ts    # formatHours
│   │   ├── string.ts    # getInitials, stringToColor, debounce
│   │   └── storage.ts   # setLocalStorage, getLocalStorage
│   └── constants/       # Mapas de configuración de presentación
│       ├── task.ts      # TASK_STATUS_LABELS/COLORS, TASK_PRIORITY_LABELS/COLORS
│       ├── user.ts      # ROLE_LABELS, ROLE_COLORS, ROLE_LEVEL
│       └── alert.ts     # ALERT_SEVERITY_LABELS/COLORS
│
├── repositories/        # Acceso a datos — implementaciones intercambiables
│   ├── interfaces/      # Contratos TypeScript (ITaskRepository, etc.)
│   ├── prisma/          # Implementaciones con Prisma (PostgreSQL)
│   ├── firebase/        # Implementaciones con Firebase (Legacy/Opcional)
│   └── index.ts         # Singletons exportados (Inyecta la implementación activa)
│
├── services/            # Lógica de negocio / use cases
│   ├── task.service.ts  # createTask, moveTask, reorderKanban
│   ├── team.service.ts  # inviteMember, changeRole, removeMember
│   ├── auth.service.ts  # login, register, getUserProfile
│   └── location.service.ts
│
├── hooks/
│   ├── auth-context.tsx       # AuthProvider + useAuth
│   ├── protected-route.tsx    # ProtectedRoute + withAuth HOC
│   ├── queries/               # React Query — lectura de datos
│   │   ├── use-tasks-query.ts
│   │   ├── use-members-query.ts
│   │   └── use-locations-query.ts
│   └── mutations/             # React Query — escritura de datos
│       ├── use-create-task.ts
│       ├── use-update-task.ts
│       ├── use-move-task.ts
│       ├── use-delete-task.ts
│       ├── use-invite-member.ts
│       └── use-update-member.ts
│
├── stores/              # Zustand — SOLO estado de UI efímero
│   ├── kanban-ui.store.ts  # dragState + modales + filtros de UI
│   ├── team-ui.store.ts    # searchQuery + roleFilter + modal
│   └── scrum-ui.store.ts   # selectedSprintId + viewMode
│
├── components/
│   ├── providers.tsx    # QueryClientProvider + AuthProvider
│   ├── ui/              # Componentes base (Avatar, Badge, Button, Card, Dialog, Input, Tabs)
│   ├── layout/          # Sidebar, Header, Footer
│   ├── tareas/          # KanbanBoard, KanbanColumn, KanbanCard, modales
│   ├── equipo/          # MemberCard, InviteMemberModal
│   └── calendario/      # CalendarView (FullCalendar)
│
└── app/
    ├── layout.tsx           # Root layout con <Providers>
    ├── (auth)/              # Login, Register
    ├── dashboard/           # Layout protegido + páginas
    └── api/                 # Endpoints HTTP (usan Admin SDK)
        └── upload/route.ts  # POST — Cloudinary upload
```

---

## Flujo de una operación

**Ejemplo: crear una tarea**

```
1. Usuario hace clic "Nueva tarea"
   → useKanbanUIStore.openCreateModal()       [Zustand — abre modal]

2. Usuario completa el formulario y envía
   → useCreateTask().mutate(formValues)        [Hook mutation]

3. Hook llama al servicio
   → taskService.createTask(dto, userId, biz) [Service — valida]

4. Servicio llama al repositorio
   → taskRepository.create(payload)           [Repository]

5. Repositorio llama al driver
   → prisma.task.create({ data: payload })    [repositories/prisma/task.repository.ts]

6. Éxito → React Query invalida el cache
   → queryClient.invalidateQueries(['tasks'])
   → useTasksQuery refetch automático
   → KanbanBoard re-renderiza con la nueva tarea

7. Modal se cierra
   → useKanbanUIStore.closeCreateModal()      [Zustand]
```

---

## Zustand vs React Query

| | Zustand (`stores/`) | React Query (`hooks/queries/` + `hooks/mutations/`) |
|---|---|---|
| **Qué maneja** | Estado efímero de UI | Datos del servidor |
| **Cuándo se pierde** | Al recargar la página | Persiste en cache con staleTime |
| **Ejemplos** | modal abierto/cerrado, drag state, filtros de búsqueda | lista de tareas, miembros, locations |
| **Quién lo actualiza** | El componente directamente | Se invalida automáticamente tras mutations |

---

## Portabilidad

### Cambiar PostgreSQL por MongoDB / Otro
1. Crear `src/repositories/mongodb/task.repository.ts` implementando `ITaskRepository`
2. Cambiar `src/repositories/index.ts` para exportar las instancias nuevas
3. **Nada más cambia** — services, hooks, stores, components son idénticos (Portabilidad Realizada)

### Cambiar Next.js por Remix
1. Migrar `src/app/` (rutas de Next.js → loaders/actions de Remix)
2. **Nada más cambia** — repositories, services, types, stores, hooks de React Query son compatibles

### Cambiar Zustand por Jotai
1. Reescribir `src/stores/*.store.ts`
2. Actualizar imports en componentes
3. Services y repositories no se tocan

---

## Jerarquía de roles

```
superadmin (5) → TecnoFusión — acceso total
admin      (4) → Gestiona su empresa
responsable(3) → Gestiona locales/sectores asignados
miembro    (2) → Trabaja en tareas asignadas
viewer     (1) → Solo lectura
```

Definido en `src/lib/constants/user.ts` — es la única fuente de verdad para labels, colores y niveles.

---

## Comandos

```bash
npm run dev:all        # Firebase Emulators + Next.js
npm run seed           # Carga datos de prueba en emuladores
npm run test:run       # Tests sin watch
npm run type:check     # Verificación de tipos
npm run check          # lint + tipos + tests (pre-commit)
```

## Credenciales de desarrollo (emulador)

| Rol | Email | Password |
|---|---|---|
| Superadmin | admin@tecnofusion.it | superadmin123 |
| Admin | admin@negocio.com | admin123 |
| Responsable | resp-local1@negocio.com | resp123 |
| Miembro | ana@negocio.com | ana123 |
| Viewer | viewer@negocio.com | viewer123 |
