# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Tablero de Control — Contexto del Proyecto

## Qué es
SaaS multi-tenant de gestión de tareas y proyectos. Inspirado en Jira + Trello + Toki: combina kanban de equipo, planificación por ciclos/sprints, objetivos/epics, y agenda personal inteligente. Cada negocio (Business) tiene sus propios locales, equipos y usuarios. La empresa dueña del sistema es TecnoFusión (superadmin).

## Stack
- **Next.js 16** App Router + React 19 + TypeScript strict
- **Auth/Storage**: Firebase (proyecto `gestordetrabajo`) — Auth + FCM (push notifications)
- **Base de Datos**: PostgreSQL + Prisma ORM (driver `@prisma/adapter-pg`)
- **Estado client**: Zustand 5 | **Estado server**: React Query 5
- **UI**: Tailwind CSS 4 + Radix UI (patrón shadcn/ui)
- **Tests**: Vitest 4 + Testing Library + jsdom
- **AI**: Groq SDK (Whisper Large V3 Turbo para transcripción + LLM para extracción de tareas)
- **Archivos**: Cloudinary (avatars + adjuntos de tareas)
- **Emails**: Resend (primario) / Gmail SMTP (fallback) + react-email templates
- **Pagos**: MercadoPago (checkout one-time + preapproval recurrente)

## Comandos de desarrollo
```bash
npm run dev:all        # Firebase Emulators + Next.js juntos
npm run seed           # Datos de prueba en Firebase emulators
npm run seed:pg        # Datos de prueba en PostgreSQL
npm run test:run       # Todos los tests (sin watch)
./node_modules/.bin/vitest run src/test/api-tasks.test.ts  # Un solo archivo de test
npm run type:check     # Verifica tipos sin compilar
npm run check          # lint + tipos + tests (pre-commit)
```

## Jerarquía de roles (multi-tenant)
```
superadmin  → TecnoFusión — acceso total al sistema
admin       → Admin de un negocio — gestiona su empresa
responsable → Responsable de un local/sector
miembro     → Trabaja dentro de un local
viewer      → Solo lectura
```
Además existe el sistema de **custom roles** (`CustomRole` en Prisma): roles adicionales por negocio con `PermissionSet` granular (tasks/locations/teams/users/reports/billing/attachments). Se resuelven en `src/lib/permissions/resolve.ts`.

## Arquitectura en capas

```
API Route (src/app/api/**/route.ts)
  └─ requireUser()              ← verifica Firebase token + carga User de PostgreSQL
  └─ assertSameTenant()         ← guard multi-tenant (lanza TenantMismatchError)
  └─ can(user, action)          ← permisos RBAC via matriz de roles
  └─ Service (src/services/*.service.ts)       ← lógica de negocio
       └─ Repository (src/repositories/index.ts → prisma/*.repository.ts)
  └─ writeAuditLog()            ← obligatorio después de mutaciones
```

**Repositorios:** `src/repositories/` tiene tres subcarpetas: `interfaces/` (contratos IXxxRepository), `prisma/` (implementaciones actuales), `firebase/` (implementaciones alternativas). El índice `src/repositories/index.ts` exporta singletons — siempre importar desde ahí.

**Auth:** `requireUser()` en `src/lib/api/auth-helpers.ts`. Devuelve `AuthedUser | NextResponse` — si es `NextResponse`, retornarlo inmediatamente. `AuthedUser` tiene `uid`, `role`, `businessId`, `data: User`.

**Permisos:** `src/lib/permissions/` — `matrix.ts` (RBAC por rol), `resolve.ts` (resuelve custom roles con `PermissionSet`), `tenant-guard.ts` (`assertSameTenant` / `assertResourceBelongsToBusiness`). Todo re-exportado desde `src/lib/permissions/index.ts`.

**Audit log:** `src/lib/api/audit.ts` → `writeAuditLog()`. Llamar después de CREATE/UPDATE/DELETE en API routes. Acciones auditadas: `business.*`, `user.*`, `role.*`, `subscription.*`, `invoice.*`, `task.*`, `attachment.*`, `plan_config.*`, `cycle.*`, `objective.*`, `project.*`, `comment.*`, `time_entry.*`, `invite_link.*`.

## Seguridad multi-tenant — reglas críticas

- `assertSameTenant(user.data, { businessId })` — verifica que el recurso pertenece al mismo negocio del usuario. Usar en GET que filtran por businessId.
- `assertResourceBelongsToBusiness(user.data, resourceBusinessId)` — verifica que un recurso específico (tarea, ciclo, etc.) pertenece al negocio del usuario. Usar en GET/PATCH/DELETE de recursos individuales.
- **Cross-tenant task injection**: al asignar `taskIds` a un ciclo u objetivo, siempre validar que todas las tareas pertenecen al mismo `businessId` antes de llamar al service:
  ```ts
  const validCount = await prisma.task.count({ where: { id: { in: taskIds }, businessId } });
  if (validCount !== taskIds.length) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  ```
- `creatorId` override en POST /tasks: solo `admin` o `superadmin` pueden especificar un `creatorId` distinto al propio. Otros roles siempre usan `user.uid`.

## Modelos principales (Prisma)

### Task — campos importantes
```
id, title, description, status (TaskStatus), priority (TaskPriority), type (TaskType)
creatorId, projectId?, locationId?, parentId?   ← subtareas via parentId
cycleId?, objectiveId?                          ← asociación a sprint/objetivo
assignees (User[]), tags (String[])
startDate?, dueDate? (DateTime — incluye hora), completedDate?
estimatedHours?, actualHours?
recurrence (JSON): { frequency, interval, dayOfWeek?, dayOfMonth?, endDate?, count? }
position (para orden en kanban), commentCount
attachments (Attachment[]), comments (Comment[]), subtasks (Task[])
```
Enums: `TaskStatus` (backlog|todo|in_progress|in_review|done|blocked), `TaskPriority` (low|medium|high|urgent), `TaskType` (feature|bug|improvement|task|documentation)

**Lógica de recurrencia** (`TaskService.moveTask`): cuando una tarea con `recurrence` se mueve a `done`, el servicio crea automáticamente la siguiente ocurrencia.

### Cycle (Sprints/Períodos)
```
id, name, goal?, businessId
status (CycleStatus): planning | active | completed | closed
startDate?, endDate?
tasks (Task[])
```
Ciclos = sprints de trabajo. Se gestionan en `/dashboard/planificacion`. Las tareas se asocian via `cycleId`.

### Objective (Épicas/OKRs)
```
id, name, description?, businessId
status (ObjectiveStatus): active | completed | archived
progress (0-100), dueDate?
tasks (Task[])
```
Objetivos = epics o metas de alto nivel. Se gestionan en `/dashboard/planificacion/objetivos`.

### User — campos importantes
```
id (Firebase UID), email, name, role, businessId?, locationId?, customRoleId?
avatar?, phone?, isActive, lastLogin?
preferences (JSON): { theme, locale, timezone, notifications{email,push,agentReports,agentAlerts}, dashboardLayout[] }
fcmTokens (String[])   ← tokens FCM para push notifications
memberships (Membership[]) ← historial de negocios del usuario
```

### Business
```
id, name, plan (PlanId), status (BusinessStatus), logo?, adminId
featureFlags (JSON), settings (JSON): { maxLocations, maxUsers, features, localeTypes }
trialEndsAt?, suspendedAt?, suspendedReason?
```

### Subscription / Invoice
```
Subscription: plan, status (SubscriptionStatus), mpPreferenceId?, mpPayerId?
  amount, currency('ARS'), frequency (BillingFrequency)
  currentPeriodStart?, currentPeriodEnd?, nextBillingDate?
  cancelAtPeriodEnd, trialEndsAt?
Invoice: subscriptionId, businessId, amount, status (InvoiceStatus), mpPaymentId?, paidAt?, pdfUrl?
```

### PlanConfig
Una fila por plan (`free/basic/pro/enterprise`). Campos: `priceMonthly`, `priceYearly`, `limitUsers`, `limitLocations`, `limitProjects`, `limitAttachments`, `updatedBy`.

### Notification
```
userId, title, body, type (info|task_assigned|task_updated|mention), link?, read, createdAt
```

## Estado del cliente

- **React Query**: queries en `src/hooks/queries/`, mutations en `src/hooks/mutations/`. Los query keys están co-localizados en el archivo de query (e.g. `taskKeys`). Las funciones HTTP viven en `src/lib/api/` (e.g. `tasksApi`, `membersApi`, `billingApi`).
- **Zustand stores** (`src/stores/`): solo estado UI efímero.
  - `kanban-ui.store.ts` — drag state, modales (create/detail/dictate), select mode, filtros (searchQuery/priority/locationId), columnas activas
  - `team-ui.store.ts` — búsqueda, filtros de rol/ubicación, modal de invitación
  - `scrum-ui.store.ts` — sprint seleccionado, viewMode (board|backlog)

## API Routes

```
/api/auth/
  POST /register, POST /forgot-password, GET /profile

/api/tasks/
  GET /, POST /              ← lista/crea
  PATCH /[id], DELETE /[id]
  GET /[id]/comments, POST /[id]/comments
  GET /[id]/subtasks, POST /[id]/subtasks
  GET /[id]/time-entries, POST /[id]/time-entries
  POST /from-audio            ← Groq Whisper → extracción con LLM
  POST /from-text             ← extracción LLM desde texto

/api/comments/
  PATCH /[id], DELETE /[id]

/api/time-entries/
  PATCH /[id], DELETE /[id]

/api/cycles/
  GET /, POST /
  GET /[id], PATCH /[id], DELETE /[id]
  POST /[id]/tasks            ← asigna/remueve tareas del ciclo (valida cross-tenant)

/api/objectives/
  GET /, POST /
  GET /[id], PATCH /[id], DELETE /[id]
  POST /[id]/tasks            ← asigna/remueve tareas del objetivo (valida cross-tenant)

/api/projects/
  GET /, POST /
  GET /[id], PATCH /[id], DELETE /[id]

/api/locations/
  GET /, POST /
  PATCH /[id], DELETE /[id]

/api/members/
  GET /, POST /
  PATCH /[id], DELETE /[id]

/api/users/
  POST /create                ← crea usuario (enforcement del límite por plan → 429)
  POST /fcm-token             ← registra token FCM
  POST /test-fcm              ← envía push de prueba

/api/notifications/
  GET /
  PATCH /[id]                 ← marca como leída

/api/business/
  GET /config, GET /subscription, POST /subscription, GET /invoices

/api/planes/
  GET /                       ← público — lista planes efectivos desde DB

/api/superadmin/
  planes: PATCH /
  businesses: GET /, POST /, GET /[id], PATCH /[id]
  users: GET /, POST /, GET /[id], PATCH /[id], POST /bulk
  subscriptions: GET /, GET /[businessId]
  audit: GET /
  metrics: GET /

/api/mercadopago/
  POST /checkout, POST /preapproval, POST /recover
  POST /cancel, POST /sync, POST /webhook

/api/upload/
  POST /                      ← sube a Cloudinary (avatar o attachment de tarea)

/api/cron/
  POST /subscription-expiry   ← verifica suscripciones vencidas + emails

/api/test/
  GET /, POST /mail
```

## Rutas de la app

```
src/app/
├── (auth)/           # login, register, forgot-password — sin sidebar
├── (superadmin)/     # panel TecnoFusión — layout propio con superadmin-sidebar
│   └── superadmin/
│       ├── planes/        # configuración de precios y límites
│       ├── businesses/    # gestión de negocios (+ [id] detalle)
│       ├── users/
│       ├── subscriptions/
│       └── audit/
├── dashboard/        # app principal — layout 'use client' con ProtectedRoute + Sidebar + Header
│   ├── tareas/        # 4 tabs: Kanban | Agenda | Calendario | Cronograma
│   │   ├── (index)    # Kanban board — drag-drop, selección múltiple, dictado AI
│   │   │              # Sprint tabs: Todas | Backlog | [Sprint activo] | Otros ▾
│   │   ├── agenda/    # Agenda inteligente — scoring diario, secciones auto, quick status
│   │   ├── calendario/# FullCalendar — mes/semana/lista, drag-drop, ghost recurrencias
│   │   └── cronograma/# Gantt view
│   ├── planificacion/ # Ciclos (sprints) + Objetivos (epics)
│   │   ├── (index)    # Períodos de trabajo (Cycles) — planning/active/completed/closed
│   │   └── objetivos/ # Objetivos con progreso (0-100%)
│   ├── equipo/        # gestión de miembros
│   │   └── roles/     # roles personalizados con PermissionSet
│   ├── sectores/      # gestión de locales/ubicaciones
│   ├── reportes/      # reportes (en desarrollo)
│   ├── billing/       # facturación y planes
│   └── config/        # configuración del negocio
└── api/
```

## Sprint Tabs en Kanban (`/dashboard/tareas`)

Barra secundaria debajo del toolbar principal. Usa `useScrumUIStore` (`src/stores/scrum-ui.store.ts`): `selectedSprintId` + `viewMode: 'board' | 'backlog'`.

**Tabs:**
- **Todas** — sin filtro de ciclo (`viewMode: 'board'`, `selectedSprintId: null`)
- **Backlog** — tareas sin ciclo (`viewMode: 'backlog'` → filter `noCycle: true`)
- **[Nombre del ciclo activo]** — tab dinámico con punto verde, solo si hay un ciclo con `status: 'active'`
- **Otros ▾** — dropdown con ciclos planning/completed/closed

**Filtros server-side:** `TaskFilters` acepta `cycleId?: string[]` y `noCycle?: boolean`. Fluyen por `tasksApi` → `GET /api/tasks` → `taskRepository.buildWhere()`.

**CreateTaskModal:** si el tab activo es un sprint (`viewMode: 'board'` + `selectedSprintId`), el campo "Período/Sprint" se pre-selecciona automáticamente al abrir el modal. El field solo aparece si el negocio tiene al menos un ciclo.

**`CreateTaskDTO`** incluye `cycleId?: string` — el repositorio lo pasa a Prisma por spread (`...rest`).

## Agenda Inteligente (`/dashboard/tareas/agenda`)

Vista diaria tipo Toki con scoring automático. Componente: `src/components/tareas/agenda-view.tsx`.

**Secciones (en orden de urgencia):**
1. ⚡ **Foco del día** — top 3 tareas por score (no muestra si hay 0 activas)
2. 🔴 **Vencidas** — `dueDate < hoy`, status ≠ done, con label "Xh atrás"
3. 🕐 **Hoy con hora** — `dueDate = hoy` con hora ≠ 00:00, orden cronológico
4. 🎯 **Para hoy** — `dueDate = hoy` todo-día, orden por score
5. 📅 **Esta semana** — próximos 7 días, orden por fecha
6. ⏱ **Próximamente** — próximos 30 días, colapsable
7. 📥 **Sin fecha** — sin `dueDate`, colapsable, orden por score
8. ✅ **Completadas** — colapsadas por defecto, últimas 30

**Scoring:** `PRIORITY_SCORE + STATUS_SCORE + 300 (asignado a mí) + 50 (creador) + min(horasAtraso×10, 500)`

**Quick actions:** click en círculo → dropdown de status (usa `useMoveTask` — activa recurrencia automática).

**`now` reactivo:** se actualiza cada 60s y en `window.focus` — no se congela al medianoche.

## Tipos

Todos los tipos en `src/types/`, re-exportados desde `src/types/index.ts`:
- `domain/` — task, user, business, team, location, project, subscription, audit-log, notification, custom-role, alert, calendar, sprint, report, widget, agent, cycle, objective
- `dto/` — task.dto (CreateTaskDTO, UpdateTaskDTO, MoveTaskDTO, ReorderKanbanDTO), auth.dto, team.dto (InviteMemberDTO, UpdateMemberDTO)
- `ui/` — kanban.ui (KanbanDragState, KanbanUIFilters), forms.ui (TaskFormValues, UserFormValues, InviteMemberFormValues)
- `api/` — responses (ApiResponse<T>, PaginatedResponse<T>)

`ROLE_LEVEL` también se exporta desde `src/types/index.ts` para comparación numérica de roles.

## Integraciones

**Groq** (`src/lib/groq/`):
- `transcribe.ts` → `transcribeAudio(buffer, filename)` — usa Whisper Large V3 Turbo
- `extract-tasks.ts` → `extractTasks(text, members, today)` → `ExtractedTask[]` — extrae título, prioridad, status, assignees, tags, dueDate, dueTime, recurrencia, horas estimadas

**Cloudinary** (`src/lib/cloudinary/`):
- `uploadUserAvatar(userId, file)` → 200×200 optimizado
- `uploadTaskAttachment(taskId, fileName, file)` → WebP, quality auto, max 1000px

**Firebase FCM** (`src/lib/firebase/admin.ts`):
- Push notifications a los `fcmTokens` del usuario
- Helper en `src/lib/notifications.ts`: crea `Notification` en DB + envía FCM; limpia tokens inválidos

**Email** (`src/lib/mail/`):
- Templates (react-email): `WelcomeEmail`, `ResetPasswordEmail`, `TeamInviteEmail`, `SubscriptionActivatedEmail`, `SubscriptionExpiryEmail`, `PaymentSuccessEmail`, `PaymentFailedEmail`, `TaskAssignedEmail`
- Delivery: Resend (`src/lib/resend.ts`) si `RESEND_API_KEY`; fallback Gmail SMTP (`src/lib/gmail.ts`)

**MercadoPago** (`src/lib/mercadopago/`):
- `plans.ts` — definición estática de planes
- `plan-config.ts` — lee overrides desde DB (`getEffectivePlanConfig`, `getAllEffectivePlanConfigs`), fallback a `plans.ts`
- `preapproval.ts` — suscripciones recurrentes
- API client: `src/lib/api/billing.ts` (`billingApi`)

## Acceso superadmin

1. `.env.local`: `SUPERADMIN_EMAILS=email@ejemplo.com`
2. Registrarse en `/register` con ese email
3. `GET /api/auth/profile` auto-provisiona el user en PostgreSQL con `role: 'superadmin'`
4. Login y registro redirigen automáticamente a `/superadmin` (usuarios con otro rol van a `/dashboard`)

## Tests

Tests en `src/test/`. Setup en `src/test/setup.ts`. Entorno jsdom.

Nomenclatura: `api-*.test.ts` para API routes, `hooks-*.test.ts` para hooks, `*.test.tsx` para componentes.

**Mocks en tests de API routes:**
- `authedUser` mock siempre debe incluir `data: { id, role, businessId }` — lo usa `assertSameTenant` y `assertResourceBelongsToBusiness`.
- `userRepository` mock debe incluir `addMembership: vi.fn()`.
- `businessRepository` mock debe incluir `findById: vi.fn()` (usado en `/api/auth/profile` para `isOwner`).
- Routes que llaman `getTaskBusinessId()` (comments, time-entries, upload) requieren `prisma.task.findUnique` mockeado con `{ project: { businessId }, location: null, creator: null }`.
- `dbUser` fixtures deben incluir `memberships: [{ businessId, role, isActive: true }]` para evitar que el profile route entre en el branch de auto-provisioning.

## Reglas críticas
- Server Components por defecto — `'use client'` solo cuando sea necesario
- Firebase client SDK **solo** en componentes con `'use client'`
- Firebase Admin SDK **solo** en Server Components y API routes
- Path alias `@/` para todos los imports internos
- `cn()` de `@/lib/utils` para clases condicionales de Tailwind
- No usar `any` en TypeScript
- Prisma client: singleton en `src/lib/prisma.ts`, importar desde ahí
- Repositories: siempre importar singletons desde `src/repositories/index.ts`
- Emails: `src/lib/mail/` (templates) + `src/lib/resend.ts` (cliente Resend)
- Pagos: `src/lib/mercadopago/` — `plans.ts` + `plan-config.ts` + `preapproval.ts`; API client: `src/lib/api/billing.ts` (`billingApi`)
- Planes DB: modelo `PlanConfig` en Prisma — una fila por plan. Seed: `npx tsx prisma/seed-plan-config.ts`. Superadmin edita desde `/superadmin/planes`. Componentes billing leen desde `GET /api/planes` (dinámico).
- Límite de usuarios por plan: enforcement en `src/app/api/users/create/route.ts` — retorna `{ error: 'members_limit_exceeded', limit, current }` con status 429. El modal `create-user-modal.tsx` muestra bloque de upgrade con link a `/dashboard/billing`.
- Tareas con hora: `dueDate` es `DateTime` en Prisma (incluye hora). La UI tiene inputs `date` + `time` separados; se combinan como `new Date(\`YYYY-MM-DDT HH:mm\`)`. La hora se muestra en kanban card y detail modal solo si ≠ medianoche local. En agenda, hora ≠ 00:00 = sección "Hoy con hora".
- Uploads: `src/lib/cloudinary/` — `upload.ts` + `config.ts`
- Notificaciones: siempre usar `src/lib/notifications.ts` para crear notificaciones — escribe en DB + envía FCM en una sola llamada.
- Recurrencia de tareas: no crear la siguiente ocurrencia manualmente — el `TaskService.moveTask()` lo hace automáticamente al completar una tarea recurrente.
- **Cambios de status de tarea**: siempre usar `useMoveTask` (no `useUpdateTask`) para garantizar que `moveTask()` se ejecute en backend — activa la creación de la siguiente ocurrencia en tareas recurrentes.
- Ciclos/Objetivos: al asignar tareas vía `POST /api/cycles/[id]/tasks` o `POST /api/objectives/[id]/tasks`, el endpoint valida que todas las `taskIds` pertenezcan al mismo `businessId`. El body debe ser `{ taskIds: string[], action?: 'assign' | 'remove' }`.
- Sprint tabs en Kanban: usar `useScrumUIStore` para leer/setear `selectedSprintId` y `viewMode`. NO crear estado local para el filtro de sprint — el store es la fuente de verdad compartida entre `page.tsx` y `CreateTaskModal`.
- `TaskFilters` soporta `cycleId?: string[]` (filtrar por ciclos) y `noCycle?: boolean` (solo tareas sin ciclo). El API route `/api/tasks` deserializa ambos desde query params.
