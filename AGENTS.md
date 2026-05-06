<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Tablero de Control — Guía para Agentes de Código

## Visión general

**Tablero de Control** es un SaaS multi-tenant de gestión de tareas y proyectos. Cada negocio (Business) tiene sus propios locales (Location), equipos (Team), proyectos y usuarios. La empresa dueña del sistema es **TecnoFusión**, que accede con rol `superadmin`.

El sistema soporta kanban con drag & drop, calendario (FullCalendar), cronograma/timeline (Gantt), gestión de suscripciones con MercadoPago, roles custom por negocio, transcripción de audio a tareas mediante IA (Groq), comentarios con menciones, checklists, subtareas, ciclos/períodos de trabajo, objetivos/iniciativas, múltiples tableros, y registro de tiempos por tarea.

---

## Stack tecnológico

| Capa | Tecnología | Versión clave |
|---|---|---|
| Framework | Next.js App Router | 16.2.3 |
| UI | React + TypeScript strict | 19.2.4 / TS 5 |
| Estilos | Tailwind CSS + Radix UI | Tailwind 4 |
| Estado UI | Zustand | 5.0.12 |
| Estado servidor | TanStack Query (React Query) | 5.99.0 |
| Auth & Storage | Firebase | 12.12.0 (cliente) / 13.8.0 (admin) |
| Base de datos | PostgreSQL + Prisma ORM | Prisma 7.7.0 con `@prisma/adapter-pg` |
| Archivos | Cloudinary | SDK v2 |
| Pagos | MercadoPago | API de preapproval |
| Email | Resend + React Email | — |
| IA / Audio | Groq SDK | Transcripción + extracción de tareas |
| Calendario | FullCalendar | 6.1.20 |
| Timeline / Gantt | FullCalendar Timeline + Resource Timeline | 6.1.20 |
| Gráficos | Recharts | 3.8.1 |
| Drag & Drop | @dnd-kit + react-dnd | — |
| Tablas | @tanstack/react-table | 8.21.3 |

**Node.js requerido:** `>=22.0.0` (ver `.nvmrc`).

---

## Arquitectura y organización del código

### Filosofía: capas con dependencia unidireccional

```
components / pages
      ↓
hooks/queries + hooks/mutations     ← React Query (server state)
hooks/stores                        ← Zustand (UI state)
      ↓
services/                           ← lógica de negocio
      ↓
repositories/                       ← acceso a datos (interfaces)
      ↓
repositories/prisma/                ← implementación principal
      ↓
Base de Datos (PostgreSQL)
```

**Regla de oro:** las capas externas importan de las internas, nunca al revés.

### Prohibiciones explícitas
- `repositories/` no importa de `services/`, `hooks/` ni `components/`
- `services/` no importa de `hooks/` ni `components/`
- `components/` no importa de `repositories/` directamente
- `stores/` solo importa tipos de dominio (nunca services ni repositories)

### Estructura de carpetas (`src/`)

```
src/
├── app/                    # Next.js App Router (page.tsx, layout.tsx, route.ts)
│   ├── (auth)/             # Login, Register — sin sidebar
│   ├── (superadmin)/       # Panel TecnoFusión — layout propio
│   │   └── superadmin/
│   │       └── planes/     # Edición de precios y límites por plan
│   ├── dashboard/          # App principal con Sidebar + Header
│   │   ├── tareas/         # Kanban board + Calendar + Cronograma toggle
│   │   ├── equipo/         # Gestión de miembros
│   │   ├── sectores/       # Locales
│   │   ├── calendario/     # Vista calendario standalone
│   │   ├── ciclos/         # Períodos de trabajo (planning/active/completed/closed)
│   │   ├── objetivos/      # Iniciativas/campañas con progreso
│   │   ├── cronograma/     # Vista Gantt/Timeline con FullCalendar
│   │   ├── billing/
│   │   └── config/
│   ├── planes/             # GET público — planes efectivos desde DB
│   └── api/                # API routes (auth, tasks, members, locations, superadmin, mercadopago, upload, etc.)
│
├── components/
│   ├── ui/                 # Componentes base reutilizables (Avatar, Badge, Button, Card, Dialog, Input, Tabs, etc.)
│   ├── layout/             # Sidebar, Header, Footer
│   ├── tareas/             # KanbanBoard, KanbanColumn, KanbanCard, modales
│   │                         # TaskDetailModal, CreateTaskModal, DictateTasksModal
│   │                         # TaskComments, TaskChecklist, TaskSubtasks, TaskAttachments
│   │                         # TaskTimeTracking (registro de horas)
│   ├── equipo/             # MemberCard, InviteMemberModal, CreateUserModal
│   ├── sectores/           # SectorList, SectorModal
│   ├── calendario/         # CalendarView, FullCalendarWrapper
│   ├── ciclos/             # CycleList, CycleCard, CycleModal
│   ├── objetivos/          # ObjectiveList, ObjectiveCard, ObjectiveModal
│   ├── cronograma/         # GanttView (FullCalendar resource-timeline)
│   ├── billing/            # Plan cards, invoices
│   ├── roles/              # PermissionGrid, RoleCard, RoleEditorDrawer
│   └── superadmin/         # SuperadminSidebar
│
├── hooks/
│   ├── auth-context.tsx    # AuthProvider + useAuth
│   ├── protected-route.tsx # ProtectedRoute + withAuth HOC
│   ├── queries/            # React Query — lectura (use-tasks-query, use-members-query, etc.)
│   └── mutations/          # React Query — escritura (use-create-task, use-update-task, etc.)
│
├── stores/                 # Zustand — SOLO estado UI efímero
│   ├── kanban-ui.store.ts
│   ├── scrum-ui.store.ts
│   └── team-ui.store.ts
│
├── services/               # Lógica de negocio / casos de uso
│   ├── task.service.ts
│   ├── team.service.ts
│   ├── auth.service.ts
│   ├── location.service.ts
│   ├── comment.service.ts
│   ├── cycle.service.ts
│   ├── objective.service.ts
│   ├── project.service.ts        # Tableros (reutiliza modelo Project)
│   ├── time-entry.service.ts     # Registro de tiempos
│   └── mail.service.ts
│
├── repositories/           # Acceso a datos — implementaciones intercambiables
│   ├── interfaces/         # Contratos TypeScript (ITaskRepository, IUserRepository, ICommentRepository, etc.)
│   ├── prisma/             # Implementaciones con Prisma (PostgreSQL)
│   │                         # Task, User, Location, Business, Comment repositories
│   ├── firebase/           # Implementaciones alternativas (legacy)
│   └── index.ts            # Singletons exportados — SIEMPRE importar desde aquí
│
├── types/
│   ├── domain/             # Entidades de negocio (task, user, team, business, location, project, etc.)
│   ├── dto/                # Payloads de entrada/salida (CreateTaskDTO, UpdateTaskDTO, etc.)
│   ├── ui/                 # Tipos de estado UI (KanbanDragState, KanbanUIFilters, etc.)
│   ├── api/                # Tipos de respuesta HTTP (PaginatedResponse, ApiResponse, etc.)
│   └── index.ts            # Re-exporta todo
│
├── lib/
│   ├── firebase/           # Drivers de infraestructura (client.ts, admin.ts, auth.ts, firestore.ts, storage.ts)
│   ├── cloudinary/         # Upload de archivos (server-side)
│   ├── mercadopago/        # Cliente MP — plans.ts (estático), plan-config.ts (DB), preapproval.ts
│   ├── groq/               # Cliente Groq, transcribe, extract-tasks
│   ├── mail/               # Templates React Email (welcome, reset-password, team-invite)
│   ├── resend.ts           # Cliente Resend
│   ├── prisma.ts           # Singleton PrismaClient con adapter pg
│   ├── api/                # Helpers de API routes (auth-helpers.ts, audit.ts, tasks.ts, members.ts, etc.)
│   │                         # tasksApi, membersApi, locationsApi, projectsApi, cyclesApi, objectivesApi
│   │                         # timeEntriesApi, billingApi, commentsApi
│   ├── permissions/        # Matriz RBAC, resolución de custom roles, tenant-guard
│   ├── constants/          # Labels, colores, niveles de roles y estados de tarea
│   └── utils/              # Funciones puras (cn, date, format, string, storage)
│
└── test/                   # Utilidades y tests unitarios
    ├── setup.ts            # Setup de Vitest (mocks de Prisma y Firebase)
    └── seed.ts             # Datos de prueba para emuladores Firebase
```

---

## Jerarquía de roles (multi-tenant)

```
superadmin  (5) → TecnoFusión — acceso total al sistema
admin       (4) → Admin de un negocio — gestiona su empresa
responsable (3) → Responsable de un local/sector
miembro     (2) → Trabaja dentro de un local
viewer      (1) → Solo lectura
```

Fuente de verdad para labels, colores y niveles: `src/lib/constants/user.ts` (exportado también en `src/types/index.ts` como `ROLE_LEVEL`).

---

## Comandos de desarrollo

```bash
# Desarrollo local
npm run dev              # Solo Next.js
npm run dev:all          # Firebase Emulators + Next.js juntos (concurrently)
npm run emulators        # Solo emuladores (importa ./firestore-seed, exporta al salir)
npm run emulators:clean  # Emuladores sin export-on-exit

# Datos de prueba
npm run seed             # Carga datos de prueba en emuladores (src/test/seed.ts)
npm run seed:pg          # Seed en PostgreSQL (scripts/seed-pg.ts)
npm run seed:superadmin  # Crea superadmin en PostgreSQL
npm run seed:export      # Exporta datos de emuladores a ./firestore-seed

# Build
npm run build            # Build de producción
npm run build:prod       # Alias de build
npm run start            # Inicia en producción

# Calidad de código
npm run lint             # ESLint (flat config — eslint.config.mjs)
npm run type:check       # TypeScript --noEmit
npm run check            # lint + tipos + tests (pre-commit recomendado)

# Tests unitarios (Vitest + jsdom + Testing Library)
npm test                 # Watch mode
npm run test:run         # Una sola pasada
npm run test:ui          # UI interactiva
npm run test:coverage    # Con cobertura

# Tests E2E (Playwright)
npx playwright test      # Ejecuta tests en tests/
```

### Credenciales de desarrollo (emulador)

| Rol | Email | Password |
|---|---|---|
| Superadmin | admin@tecnofusion.it | superadmin123 |
| Admin | admin@negocio.com | admin123 |
| Responsable | resp-local1@negocio.com | resp123 |
| Miembro | ana@negocio.com | ana123 |
| Viewer | viewer@negocio.com | viewer123 |

---

## Guías de estilo y convenciones

### Componentes React
- **Server Components por defecto** — agregar `'use client'` solo cuando sea necesario (eventos, hooks, estado local, Firebase client SDK).
- Firebase client SDK **solo** en componentes marcados con `'use client'`.
- Firebase Admin SDK **solo** en Server Components y API routes (`route.ts`).

### TypeScript
- `strict: true` activo en `tsconfig.json`.
- **No usar `any`** — si no se conoce el tipo, usar `unknown` o definirlo.
- Path alias `@/` para todos los imports internos (configurado en `tsconfig.json` y `vitest.config.ts`).

### Tailwind CSS
- Usar `cn()` de `@/lib/utils` (o `@/lib/utils/cn.ts`) para clases condicionales.
- Tailwind 4 con PostCSS (`postcss.config.mjs`). No hay `tailwind.config.js` tradicional; usa CSS-first configuration si es necesario.

### Prisma
- PrismaClient es un **singleton** en `src/lib/prisma.ts`. Nunca instanciar `PrismaClient` directamente; importar desde `@/lib/prisma`.
- Usa el adapter PostgreSQL (`@prisma/adapter-pg`) en lugar del driver nativo.
- El schema está en `prisma/schema.prisma`.

### Repositorios
- Siempre importar los singletons desde `src/repositories/index.ts` (no desde `repositories/prisma/*` directamente).
- Si se agrega un nuevo repositorio, crear la interfaz en `interfaces/`, la implementación en `prisma/`, y exportar el singleton en `index.ts`.

### API Routes
- Autenticación: usar `requireUser(req)` desde `@/lib/api/auth-helpers`. Retorna `AuthedUser | NextResponse`; si es `NextResponse`, devolverlo inmediatamente.
- Multi-tenant: usar `assertSameTenant()` desde `@/lib/permissions/tenant-guard` cuando se valida acceso a recursos de otro negocio.
- Permisos: usar `can(user, action)` desde `@/lib/permissions/` para RBAC.
- Audit log: llamar `writeAuditLog()` desde `@/lib/api/audit` **obligatoriamente** después de toda operación CREATE/UPDATE/DELETE.

### Estado del cliente
- **React Query** para datos del servidor. Query keys co-localizados en el archivo de query. Funciones HTTP en `src/lib/api/` (e.g. `tasksApi`, `membersApi`).
- **Zustand** solo para estado UI efímero: modales abiertos, drag state, filtros de vista.

### Emails
- Templates en `src/lib/mail/templates/` usando React Email.
- Cliente Resend en `src/lib/resend.ts`.

### Pagos y planes
- **Definición estática:** `src/lib/mercadopago/plans.ts` — valores base (fallback cuando no hay fila en DB).
- **Configuración dinámica (DB):** tabla `PlanConfig` en PostgreSQL. Superadmin edita desde `/superadmin/planes`. Usar siempre `getEffectivePlanConfig(planId)` o `getAllEffectivePlanConfigs()` (en `src/lib/mercadopago/plan-config.ts`) en server-side — nunca leer `PLANS` directamente si hay datos de plan.
- **API pública de planes:** `GET /api/planes` (sin auth) — retorna planes efectivos para componentes de billing.
- **API superadmin:** `GET+PATCH /api/superadmin/planes` — requiere `role = 'superadmin'`.
- **Enforcement de límites:**
  - `POST /api/users/create` verifica `PlanConfig.limitUsers`. Retorna `429 { error: 'members_limit_exceeded', limit, current }`.
  - `POST /api/projects` verifica `PlanConfig.limitProjects` (tableros). Retorna `429 { error: 'projects_limit_exceeded', limit, current }`.
  - Skip para superadmin en ambos casos.
- **Preapproval y webhook:** `src/lib/mercadopago/preapproval.ts`.
- **API client (browser):** `billingApi` en `src/lib/api/billing.ts` — incluye `getPlans()`, `createPreapproval()`, `cancelSubscription()`, `syncSubscription()`, `recoverSubscription()`.

---

## Estrategia de testing

### Tests unitarios / de integración
- Framework: **Vitest 4** con entorno `jsdom`.
- Setup global: `src/test/setup.ts` (mockea Prisma y Firebase).
- Patrón de archivos: `src/**/*.test.ts`, `src/**/*.test.tsx`.
- Testing Library: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- Nomenclatura sugerida:
  - `api-*.test.ts` — API routes
  - `hooks-*.test.ts` — Custom hooks
  - `*.test.tsx` — Componentes React

### Tests E2E
- Framework: **Playwright** (`playwright.config.ts`).
- Directorio: `tests/`.
- Config: 1 worker, 1 retry, timeout 40s, navegador Chromium.
- Screenshots, video y trace se retienen solo en fallos.
- Auth persistente: `tests/.auth/superadmin.json` (generado por `tests/global.setup.ts`).
- Archivos de spec: `auth.spec.ts`, `dashboard.spec.ts`, `equipo.spec.ts`, `tareas.spec.ts`, `sectores.spec.ts`, `superadmin.spec.ts`, `config.spec.ts`, `permisos.spec.ts`.

---

## Seguridad

### Autenticación
- Firebase Auth maneja tokens JWT. El Admin SDK (`src/lib/firebase/admin.ts`) verifica tokens en API routes.
- El perfil de usuario se auto-provisiona en PostgreSQL en `GET /api/auth/profile`.
- Superadmin se determina por `SUPERADMIN_EMAILS` en `.env.local`.

### Autorización
- RBAC base en `src/lib/permissions/matrix.ts`.
- Roles custom por negocio en `src/lib/permissions/resolve.ts` (resuelve `PermissionSet`).
- Tenant guard en `src/lib/permissions/tenant-guard.ts`.

### Firestore Rules
- Reglas en `firestore.rules` con lógica multi-tenant:
  - `sameTenant(businessId)` restringe acceso por negocio.
  - Subscriptions, invoices y audit logs son **server-write only** (`allow write: if false`).
  - Solo superadmin puede crear businesses.

### Variables de entorno sensibles
- Firebase Admin SDK (`FIREBASE_SERVICE_ACCOUNT`)
- MercadoPago (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`)
- Cloudinary (`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- Groq (`GROQ_API_KEY`)
- Resend (implícito en `RESEND_API_KEY` si existe)

Nunca commitear `.env.local`. Usar `.env.example` como plantilla.

---

## Despliegue

### Docker
- `Dockerfile` multi-stage (deps → builder → runner) basado en `node:22.15-alpine`.
- En runtime ejecuta `start.sh`: `npx prisma db push --skip-generate --accept-data-loss && npx next start -p ${PORT:-3000}`.

### Firebase App Hosting
- Configuración en `apphosting.yaml`.
- Define variables de entorno y secrets para runtime.

### Railway
- Configuración en `railway.json` usando Nixpacks.
- Build: `npx prisma generate && npx prisma migrate deploy && npm run build`.
- Deploy: `npm start`.
- `nixpacks.toml` fija Node.js 24.

### Firebase (servicios)
- Proyecto: `gestordetrabajo`.
- Emuladores: Auth (9099), Firestore (8080), Functions (5001), UI (4000).
- Rules e índices de Firestore se despliegan con `npm run deploy:rules`.

---

## Nuevos endpoints (post-FASE 1-5)

### Tareas
- `GET/POST /api/tasks/[id]/comments` — comentarios en tarea
- `DELETE /api/comments/[id]` — eliminar comentario
- `GET/POST /api/tasks/[id]/subtasks` — subtareas jerárquicas
- `GET/POST /api/tasks/[id]/time-entries` — registro de tiempos
- `DELETE /api/time-entries/[id]` — eliminar registro de tiempo

### Ciclos (Períodos de trabajo)
- `GET/POST /api/cycles`
- `GET/PATCH/DELETE /api/cycles/[id]`
- `GET /api/cycles/[id]/tasks`

### Objetivos (Iniciativas/Campañas)
- `GET/POST /api/objectives`
- `GET/PATCH/DELETE /api/objectives/[id]`
- `GET /api/objectives/[id]/tasks`

### Tableros (Projects)
- `GET/POST /api/projects`
- `GET/PATCH/DELETE /api/projects/[id]`

## Flujo típico: crear una tarea

```
1. Usuario hace clic "Nueva tarea"
   → useKanbanUIStore.openCreateModal()       [Zustand]

2. Usuario envía el formulario
   → useCreateTask().mutate(formValues)        [React Query mutation]

3. Hook llama al servicio
   → taskService.createTask(dto, userId, biz)  [Service — validación]

4. Servicio llama al repositorio
   → taskRepository.create(payload)            [Repository]

5. Repositorio persisten en PostgreSQL
   → prisma.task.create({ data: payload })     [Prisma]

6. Éxito → React Query invalida caché
   → queryClient.invalidateQueries({ queryKey: taskKeys.all })
   → KanbanBoard re-renderiza

7. Modal se cierra
   → useKanbanUIStore.closeCreateModal()       [Zustand]

8. Audit log
   → writeAuditLog({ action: 'CREATE', targetType: 'TASK', ... })
```

---

## Notas para el agente

- Siempre verificar que Next.js 16 pueda tener APIs diferentes a versiones anteriores. Consultar `node_modules/next/dist/docs/` ante la duda.
- No asumir que `repositories/prisma/` es la única implementación posible; el diseño permite reemplazarla sin tocar services ni UI.
- Al crear nuevos endpoints, seguir el patrón: `requireUser` → validar permisos/tenant → llamar service → `writeAuditLog` → retornar JSON.
- Al crear nuevos stores de Zustand, mantenerlos en `src/stores/` y limitarlos a estado UI (no datos de servidor).
