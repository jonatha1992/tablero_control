# Arquitectura — Tablero de Control

## Visión general

SaaS multi-tenant de gestión de tareas y proyectos. Arquitectura en capas diseñada para ser portable: cambiar el ORM o el framework tiene impacto mínimo en el resto del código.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 + TypeScript strict |
| Estilos | Tailwind CSS 4 + Radix UI |
| Estado UI | Zustand 5 |
| Estado servidor | TanStack Query (React Query) 5 |
| Auth | Firebase Auth (solo autenticación — sin Firestore) |
| Base de datos | PostgreSQL + Prisma ORM (`@prisma/adapter-pg`) |
| Almacenamiento | Cloudinary |
| Email | Resend (primario) / Gmail SMTP (fallback) |
| Pagos | MercadoPago Preapproval |
| IA / Audio | Groq SDK (Whisper Large V3 Turbo + LLM) |
| Tour | driver.js |
| Tests | Vitest 4 + Testing Library + jsdom |

---

## Capas y responsabilidades

```
components / pages
      ↓  (llama a)
hooks/queries + hooks/mutations     ← React Query (server state)
stores/                             ← Zustand (UI state)
      ↓  (llama a)
API Routes (src/app/api/**)         ← HTTP boundary
      ↓  (usa)
services/                           ← lógica de negocio
      ↓  (llama a)
repositories/                       ← acceso a datos
      ↓  (llama a)
src/lib/prisma.ts                   ← singleton PrismaClient → PostgreSQL
```

**Regla de oro:** las capas externas importan de las internas, nunca al revés.

### Prohibiciones explícitas
- `repositories/` no importa de `services/`, `hooks/` ni `components/`
- `services/` no importa de `hooks/` ni `components/`
- `components/` no importa de `repositories/` directamente
- `stores/` solo importa tipos de dominio
- Firebase client SDK **solo** en componentes `'use client'`
- Firebase Admin SDK **solo** en Server Components y API routes

---

## Estructura de carpetas

```
src/
├── types/
│   ├── domain/          # Entidades de negocio (framework-agnostic)
│   │   ├── task.ts      # Task, TaskStatus, TaskPriority, TaskFilters
│   │   ├── user.ts      # User, UserRole, UserPreferences
│   │   ├── business.ts  # Business, BusinessSettings
│   │   ├── location.ts  # Location
│   │   ├── cycle.ts     # Cycle, CycleStatus
│   │   ├── objective.ts # Objective, ObjectiveStatus
│   │   ├── calendar.ts  # CalendarEvent
│   │   ├── audit-log.ts # AuditLog
│   │   └── ...
│   ├── dto/             # Contratos de entrada/salida entre capas
│   │   ├── task.dto.ts  # CreateTaskDTO, UpdateTaskDTO, MoveTaskDTO, ReorderKanbanDTO
│   │   ├── team.dto.ts  # InviteMemberDTO, UpdateMemberDTO
│   │   └── auth.dto.ts
│   ├── ui/
│   │   ├── kanban.ui.ts # KanbanDragState, KanbanUIFilters
│   │   └── forms.ui.ts  # TaskFormValues, UserFormValues, InviteMemberFormValues
│   ├── api/
│   │   └── responses.ts # ApiResponse<T>, PaginatedResponse<T>
│   └── index.ts         # Re-exporta todo (incluye ROLE_LEVEL)
│
├── lib/
│   ├── firebase/
│   │   ├── client.ts    # Inicialización cliente Firebase (auth only)
│   │   ├── admin.ts     # Admin SDK + verifyToken
│   │   └── auth.ts      # login, logout, Google OAuth
│   ├── api/
│   │   ├── auth-helpers.ts  # requireUser() — verifica token + carga User de PG
│   │   └── audit.ts         # writeAuditLog()
│   ├── permissions/
│   │   ├── matrix.ts        # ROLE_MATRIX, can()
│   │   ├── resolve.ts       # resolvePermissions() para custom roles
│   │   ├── tenant-guard.ts  # assertSameTenant(), assertResourceBelongsToBusiness()
│   │   └── index.ts         # re-exporta todo
│   ├── groq/
│   │   ├── transcribe.ts    # transcribeAudio(buffer, filename) → text
│   │   └── extract-tasks.ts # extractTasks(text, members, today) → ExtractedTask[]
│   ├── cloudinary/
│   │   ├── upload.ts        # uploadUserAvatar(), uploadTaskAttachment()
│   │   └── config.ts
│   ├── mail/            # Templates react-email
│   ├── mercadopago/
│   │   ├── plans.ts         # Definición estática de planes (fallback)
│   │   ├── plan-config.ts   # getEffectivePlanConfig() — lee DB, fallback a plans.ts
│   │   └── preapproval.ts   # Suscripciones recurrentes
│   ├── prisma.ts        # Singleton PrismaClient
│   ├── notifications.ts # createNotification() — DB + FCM en una llamada
│   ├── resend.ts        # Cliente Resend
│   ├── gmail.ts         # Fallback Gmail SMTP
│   └── utils.ts         # cn(), getInitials(), stringToColor(), ROLE_LABELS, ROLE_COLORS
│
├── repositories/
│   ├── interfaces/      # Contratos TypeScript (ITaskRepository, IUserRepository, etc.)
│   ├── prisma/          # Implementaciones actuales (PostgreSQL)
│   │   ├── task.repository.ts
│   │   ├── user.repository.ts
│   │   ├── team.repository.ts
│   │   ├── location.repository.ts
│   │   ├── business.repository.ts
│   │   ├── comment.repository.ts
│   │   ├── cycle.repository.ts
│   │   ├── objective.repository.ts
│   │   ├── project.repository.ts
│   │   ├── time-entry.repository.ts
│   │   └── calendar-event.repository.ts
│   ├── firebase/        # Implementaciones alternativas (no usadas en producción)
│   └── index.ts         # Singletons exportados — siempre importar desde aquí
│
├── services/
│   ├── task.service.ts          # createTask, moveTask (lógica de recurrencia)
│   ├── team.service.ts
│   ├── auth.service.ts
│   ├── location.service.ts
│   ├── comment.service.ts
│   ├── cycle.service.ts
│   ├── objective.service.ts
│   ├── project.service.ts
│   └── time-entry.service.ts
│
├── hooks/
│   ├── auth-context.tsx         # AuthProvider + useAuth
│   ├── protected-route.tsx      # ProtectedRoute
│   ├── use-pwa-install.ts       # PWA install prompt
│   ├── queries/
│   │   ├── use-tasks-query.ts
│   │   ├── use-members-query.ts
│   │   ├── use-locations-query.ts
│   │   ├── use-business-query.ts
│   │   ├── use-cycles-query.ts
│   │   ├── use-objectives-query.ts
│   │   ├── use-projects-query.ts
│   │   ├── use-time-entries-query.ts
│   │   ├── use-calendar-events-query.ts
│   │   └── use-subscription-query.ts
│   └── mutations/
│       ├── use-create-task.ts
│       ├── use-update-task.ts
│       ├── use-move-task.ts        # Siempre usar este para cambiar estado
│       ├── use-delete-task.ts
│       ├── use-bulk-delete-tasks.ts
│       ├── use-bulk-move-tasks.ts
│       ├── use-bulk-assign-task-location.ts
│       ├── use-invite-member.ts
│       ├── use-accept-invite.ts
│       ├── use-update-member.ts
│       ├── use-create-user.ts
│       ├── use-save-role.ts
│       ├── use-locations.ts
│       ├── use-assistant-chat.ts
│       └── use-create-calendar-event.ts
│
├── stores/              # Zustand — SOLO estado de UI efímero
│   ├── kanban-ui.store.ts   # drag state, modales, select mode, filtros, columnas activas
│   ├── team-ui.store.ts     # búsqueda, filtros, modal de invitación
│   └── scrum-ui.store.ts    # selectedSprintId, viewMode (board|backlog)
│
├── components/
│   ├── providers.tsx        # QueryClientProvider + AuthProvider + ThemeProvider
│   ├── business-switcher.tsx
│   ├── ui/                  # Componentes base (shadcn/ui pattern — sin @radix-ui/accordion)
│   │   ├── button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx
│   │   ├── tabs.tsx, badge.tsx, avatar.tsx, input.tsx, textarea.tsx
│   │   ├── checkbox.tsx, confirm-dialog.tsx, native-select.tsx
│   │   └── filter-pill-group.tsx
│   ├── layout/
│   │   ├── sidebar.tsx           # Navegación colapsable con tourId en cada item
│   │   ├── header.tsx            # Título dinámico, búsqueda, botón ?, notif, avatar
│   │   ├── footer.tsx
│   │   ├── notification-bell.tsx
│   │   ├── onboarding-tour.tsx   # driver.js tour + export startOnboardingTour()
│   │   └── ai-assistant-panel.tsx
│   ├── tareas/
│   │   ├── kanban-board.tsx
│   │   ├── kanban-column.tsx
│   │   ├── kanban-card.tsx
│   │   ├── task-detail-modal.tsx
│   │   ├── create-task-modal.tsx
│   │   ├── dictate-tasks-modal.tsx
│   │   ├── agenda-view.tsx
│   │   ├── gantt-view.tsx
│   │   └── create-event-modal.tsx
│   ├── calendario/
│   │   └── calendar-view.tsx
│   ├── equipo/
│   ├── ciclos/
│   ├── objetivos/
│   └── dashboard/
│
└── app/
    ├── layout.tsx               # Root layout con <Providers>
    ├── page.tsx                 # Landing page pública
    ├── (auth)/                  # login, register, forgot-password — sin sidebar
    ├── (superadmin)/            # Panel TecnoFusión — layout propio
    │   └── superadmin/
    │       ├── page.tsx         # KPIs globales
    │       ├── businesses/
    │       ├── users/
    │       ├── subscriptions/
    │       ├── planes/
    │       └── audit/
    ├── i/[token]/               # Aceptar invitación por link
    └── dashboard/               # App principal — layout 'use client' con ProtectedRoute
        ├── layout.tsx           # Sidebar + Header + FAB IA + OnboardingTour
        ├── page.tsx             # Dashboard KPIs
        ├── tareas/
        │   ├── page.tsx         # Kanban + sprint tabs
        │   ├── agenda/          # Agenda inteligente
        │   ├── calendario/      # FullCalendar
        │   └── cronograma/      # Gantt
        ├── eventos/             # Eventos de calendario
        ├── planificacion/
        │   ├── page.tsx         # Ciclos/Períodos
        │   └── objetivos/
        ├── equipo/
        │   ├── page.tsx         # Miembros
        │   ├── sectores/
        │   └── roles/
        ├── reportes/
        ├── billing/
        ├── config/
        └── ayuda/               # Centro de ayuda + tour
    └── api/
        ├── auth/profile/
        ├── tasks/
        ├── comments/
        ├── time-entries/
        ├── cycles/
        ├── objectives/
        ├── projects/
        ├── locations/
        ├── members/
        ├── users/
        ├── notifications/
        ├── business/
        ├── planes/
        ├── calendar-events/
        ├── assistant/
        ├── superadmin/
        ├── mercadopago/
        ├── upload/
        └── cron/
```

---

## Layout del dashboard

`src/app/dashboard/layout.tsx` — cliente (`'use client'`). Contiene:
- **Sidebar** — navegación colapsable. Cada item tiene `id="tour-nav-xxx"` para el tour.
- **Header** — título dinámico por ruta, búsqueda en `/dashboard/tareas`, botón `?` (→ `/dashboard/ayuda`), campana, `BusinessSwitcher`, avatar, logout.
- **FAB IA** (`id="tour-fab"`) — botón flotante que abre `AiAssistantPanel`.
- **OnboardingTour** — componente invisible con driver.js. Se auto-inicia al primer login en `/dashboard`. El evento `'start-onboarding-tour'` lo activa manualmente desde cualquier parte.

---

## Flujo de una operación

**Ejemplo: crear una tarea**

```
1. Usuario hace clic "Nueva tarea"
   → useKanbanUIStore.openCreateModal()       [Zustand]

2. Usuario completa el formulario y envía
   → useCreateTask().mutate(formValues)        [mutation hook]

3. Hook llama al endpoint HTTP
   → POST /api/tasks                          [fetch + token Firebase]

4. API route verifica auth + permisos
   → requireUser()                            [verifica JWT + carga User de PG]
   → can(user, 'task.create')                 [RBAC]
   → assertSameTenant(user, dto)              [tenant guard]

5. API route delega al service
   → taskService.createTask(dto, user)

6. Service llama al repositorio
   → taskRepository.create(payload)           [PrismaTaskRepository]
   → prisma.task.create(...)

7. API route registra auditoría
   → writeAuditLog(...)

8. Éxito → React Query invalida cache
   → queryClient.invalidateQueries(taskKeys.all)
   → KanbanBoard re-renderiza

9. Modal se cierra
   → useKanbanUIStore.closeCreateModal()      [Zustand]
```

---

## Auth flow

1. Firebase Auth emite token JWT al login.
2. El cliente incluye el token: `Authorization: Bearer <token>`.
3. `requireUser()` llama `admin.verifyIdToken(token)` → obtiene `uid`.
4. `requireUser()` carga el `User` desde PostgreSQL por `uid`.
5. La lógica usa `user.uid`, `user.role`, `user.businessId`, `user.data`.

Firebase Auth **solo autentica** — todos los datos de dominio (rol, business, preferencias) viven en PostgreSQL.

### AuthedUser

```typescript
const userOrRes = await requireUser(req);
if (userOrRes instanceof NextResponse) return userOrRes;
const user = userOrRes;
// user.uid, user.role, user.businessId, user.data: User (completo de PostgreSQL)
```

---

## Zustand vs React Query

| | Zustand (`stores/`) | React Query (`hooks/`) |
|---|---|---|
| **Qué maneja** | Estado efímero de UI | Datos del servidor |
| **Cuándo se pierde** | Al recargar | Persiste en cache con staleTime |
| **Ejemplos** | modal abierto, drag state, filtros | lista de tareas, miembros, ciclos |
| **Quién actualiza** | El componente directamente | Invalidado automáticamente tras mutations |

### Stores actuales
- `kanban-ui.store.ts` — drag state, modales (create/detail/dictate/AI panel), select mode, filtros (searchQuery/priority/locationId), columnas activas
- `team-ui.store.ts` — búsqueda, filtros de rol/ubicación, modal de invitación
- `scrum-ui.store.ts` — `selectedSprintId`, `viewMode: 'board' | 'backlog'`

**Regla:** el store es la fuente de verdad — nunca crear estado local para algo que ya maneja un store (ej: sprint seleccionado, filtros de kanban).

---

## Seguridad multi-tenant

### Tenant guard

```typescript
// GET con filtro por businessId
assertSameTenant(user.data, { businessId: reqBusinessId });

// GET/PATCH/DELETE de recurso individual
assertResourceBelongsToBusiness(user.data, resource.businessId);
```

### Cross-tenant injection (arrays de IDs)

Siempre validar antes de operaciones masivas:

```typescript
const count = await prisma.task.count({
  where: { id: { in: taskIds }, businessId },
});
if (count !== taskIds.length) {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 });
}
```

### Audit log

Llamar `writeAuditLog()` después de toda mutación (CREATE / UPDATE / DELETE) en API routes. Acciones auditadas: `business.*`, `user.*`, `role.*`, `subscription.*`, `invoice.*`, `task.*`, `attachment.*`, `plan_config.*`, `cycle.*`, `objective.*`, `project.*`, `comment.*`, `time_entry.*`, `invite_link.*`.

---

## Recurrencia de tareas

`TaskService.moveTask()` maneja la recurrencia automáticamente: cuando una tarea con `recurrence` se mueve a `done`, el servicio crea la siguiente ocurrencia. **No crear la siguiente ocurrencia manualmente.**

**Regla:** para cambiar el estado de una tarea, usar siempre `useMoveTask` (no `useUpdateTask`). Esto garantiza que `moveTask()` se ejecute en backend y active la lógica de recurrencia.

---

## Comandos

```bash
npm run dev:all        # Firebase Auth Emulator + Next.js
npm run seed:pg        # Datos de prueba en PostgreSQL
npm run test:run       # Tests sin watch
npm run type:check     # Verificación de tipos
npm run check          # lint + tipos + tests (pre-commit)
npx prisma studio      # UI visual de la BD
npx prisma migrate dev # Nueva migración
```
