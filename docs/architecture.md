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
| Estado servidor | React Query 5 |
| Auth | Firebase Auth (solo autenticación) |
| Base de datos | PostgreSQL + Prisma ORM (`@prisma/adapter-pg`) |
| Almacenamiento archivos | Cloudinary |
| Email | Resend |
| Pagos | MercadoPago Preapproval |
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
src/lib/prisma.ts                   ← singleton PrismaClient
```

**Regla de oro:** las capas externas importan de las internas, nunca al revés.

### Prohibiciones explícitas
- `repositories/` no importa de `services/`, `hooks/` ni `components/`
- `services/` no importa de `hooks/` ni `components/`
- `components/` no importa de `repositories/` directamente
- `stores/` solo importa tipos de dominio (nunca services ni repositories)
- Firebase client SDK **solo** en componentes `'use client'` (únicamente para auth)
- Firebase Admin SDK **solo** en Server Components y API routes

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
│   │   └── ...
│   ├── dto/             # Contratos de entrada/salida entre capas
│   │   ├── task.dto.ts  # CreateTaskDTO, UpdateTaskDTO, MoveTaskDTO
│   │   ├── team.dto.ts  # InviteMemberDTO, UpdateMemberDTO
│   │   └── auth.dto.ts  # LoginDTO, RegisterDTO
│   ├── ui/              # Tipos solo relevantes para la interfaz
│   │   └── kanban.ui.ts # KanbanDragState, KanbanUIFilters
│   ├── api/
│   │   └── responses.ts # ApiResponse<T>, PaginatedResponse<T>
│   └── index.ts         # Re-exporta todo
│
├── lib/
│   ├── firebase/        # Solo auth
│   │   ├── client.ts    # Inicialización cliente Firebase
│   │   ├── admin.ts     # Admin SDK + verifyToken
│   │   └── auth.ts      # login, logout, Google OAuth
│   ├── api/             # Helpers para API routes
│   │   ├── auth-helpers.ts  # requireUser() — verifica token + carga User de PG
│   │   └── audit.ts         # writeAuditLog()
│   ├── permissions/     # RBAC
│   │   ├── matrix.ts    # ROLE_MATRIX, can()
│   │   ├── resolve.ts   # resolvePermissions() para custom roles
│   │   ├── tenant-guard.ts  # assertSameTenant(), isSameTenant()
│   │   └── index.ts     # re-exporta todo
│   ├── prisma.ts        # Singleton PrismaClient
│   ├── cloudinary/      # Upload de archivos (server-side)
│   ├── mail/            # Templates de email
│   ├── resend.ts        # Cliente Resend
│   ├── mercadopago/     # Planes + preapproval
│   └── utils/           # Funciones puras (cn, date, format, string)
│
├── repositories/        # Acceso a datos — implementaciones intercambiables
│   ├── interfaces/      # Contratos TypeScript (ITaskRepository, etc.)
│   ├── prisma/          # Implementaciones actuales (PostgreSQL)
│   │   ├── task.repository.ts
│   │   ├── user.repository.ts
│   │   ├── team.repository.ts
│   │   ├── location.repository.ts
│   │   └── business.repository.ts
│   ├── firebase/        # Implementaciones legacy (no usadas en producción)
│   └── index.ts         # Singletons Prisma exportados
│
├── services/            # Lógica de negocio / use cases
│   ├── task.service.ts
│   ├── team.service.ts
│   ├── auth.service.ts
│   └── location.service.ts
│
├── hooks/
│   ├── auth-context.tsx       # AuthProvider + useAuth
│   ├── protected-route.tsx    # ProtectedRoute
│   ├── queries/               # React Query — lectura de datos
│   │   ├── use-tasks-query.ts
│   │   ├── use-members-query.ts
│   │   ├── use-locations-query.ts
│   │   ├── use-business-query.ts
│   │   ├── use-roles-query.ts
│   │   └── use-subscription-query.ts
│   └── mutations/             # React Query — escritura de datos
│       ├── use-create-task.ts
│       ├── use-update-task.ts
│       ├── use-move-task.ts
│       ├── use-delete-task.ts
│       ├── use-invite-member.ts
│       ├── use-update-member.ts
│       ├── use-create-user.ts
│       └── use-save-role.ts
│
├── stores/              # Zustand — SOLO estado de UI efímero
│   ├── kanban-ui.store.ts
│   ├── team-ui.store.ts
│   └── scrum-ui.store.ts
│
├── components/
│   ├── providers.tsx    # QueryClientProvider + AuthProvider
│   ├── ui/              # Componentes base (shadcn/ui pattern)
│   ├── layout/          # Sidebar, Header
│   ├── tareas/          # KanbanBoard, KanbanColumn, KanbanCard, modales
│   ├── equipo/          # MemberCard, CreateUserModal, InviteMemberModal
│   ├── sectores/        # SectorModal
│   └── dashboard/       # DashboardMetrics
│
└── app/
    ├── layout.tsx           # Root layout con <Providers>
    ├── (auth)/              # Login, Register
    ├── (superadmin)/        # Panel TecnoFusión — layout propio
    ├── dashboard/           # Layout protegido + páginas
    └── api/                 # Endpoints HTTP (Auth Firebase Admin + Prisma)
        ├── auth/            # profile
        ├── tasks/           # CRUD + move
        ├── members/         # CRUD miembros
        ├── locations/       # CRUD locales
        ├── users/           # create
        ├── business/        # config, roles
        ├── superadmin/      # businesses, users, metrics, audit
        ├── mercadopago/     # webhook, preapproval, cancel
        └── upload/          # Cloudinary upload
```

---

## Flujo de una operación

**Ejemplo: crear una tarea**

```
1. Usuario hace clic "Nueva tarea"
   → useKanbanUIStore.openCreateModal()       [Zustand — abre modal]

2. Usuario completa el formulario y envía
   → useCreateTask().mutate(formValues)        [Hook mutation]

3. Hook llama al endpoint HTTP
   → POST /api/tasks                          [fetch con token Firebase]

4. API route verifica auth + permisos
   → requireUser()                            [verifica token + carga User de PG]
   → can(user, 'task.create')                 [RBAC]
   → assertSameTenant(user, dto)              [tenant guard]

5. API route delega al service
   → taskService.createTask(dto, user)        [lógica de negocio]

6. Service llama al repositorio
   → taskRepository.create(payload)           [PrismaTaskRepository]

7. Repositorio ejecuta query Prisma
   → prisma.task.create(...)                  [PostgreSQL]

8. API route registra auditoría
   → writeAuditLog(...)

9. Éxito → React Query invalida el cache
   → queryClient.invalidateQueries(taskKeys.all)
   → useTasksQuery refetch automático
   → KanbanBoard re-renderiza

10. Modal se cierra
    → useKanbanUIStore.closeCreateModal()      [Zustand]
```

---

## Auth flow

1. Firebase Auth emite token JWT al login.
2. El cliente incluye el token en cada request: `Authorization: Bearer <token>`.
3. `requireUser()` llama `admin.verifyIdToken(token)` → obtiene `uid`.
4. `requireUser()` carga el `User` desde PostgreSQL por `uid`.
5. La lógica de negocio usa el `User` de PostgreSQL (con `role`, `businessId`, etc.).

Firebase Auth **no** almacena datos de aplicación — solo autentica. Todos los datos viven en PostgreSQL.

---

## Zustand vs React Query

| | Zustand (`stores/`) | React Query (`hooks/`) |
|---|---|---|
| **Qué maneja** | Estado efímero de UI | Datos del servidor |
| **Cuándo se pierde** | Al recargar la página | Persiste en cache con staleTime |
| **Ejemplos** | modal abierto, drag state, filtros | lista de tareas, miembros, locations |
| **Quién lo actualiza** | El componente directamente | Invalidado automáticamente tras mutations |

---

## Jerarquía de roles

```
superadmin (5) → TecnoFusión — acceso total
admin      (4) → Gestiona su empresa
responsable(3) → Gestiona locales/sectores asignados
miembro    (2) → Trabaja en tareas asignadas
viewer     (1) → Solo lectura
```

Definido en `src/lib/constants/user.ts` y `ROLE_LEVEL` en `src/types/index.ts`.

---

## Comandos

```bash
npm run dev:all        # Firebase Emulators (auth) + Next.js
npm run seed:pg        # Datos de prueba en PostgreSQL
npm run test:run       # Tests sin watch
npm run type:check     # Verificación de tipos
npm run check          # lint + tipos + tests (pre-commit)
```
