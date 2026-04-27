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
| Auth | Firebase Auth (Admin SDK en server, client SDK en `'use client'`) |
| Base de datos principal | PostgreSQL + Prisma ORM (`@prisma/adapter-pg`) |
| Archivos | Cloudinary |
| Pagos | MercadoPago Preapproval API |
| Email | Resend + React Email |
| IA / Audio | Groq SDK |
| Tests | Vitest + Testing Library + jsdom |

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
repositories/                       ← acceso a datos (interfaces)
      ↓  (llama a)
repositories/prisma/                ← implementación principal (PostgreSQL)
      ↓
lib/prisma.ts                       ← singleton PrismaClient
```

**API Routes** (`src/app/api/**/route.ts`) siguen el mismo flujo pero en server:
```
requireUser()          → verifica token Firebase + carga User de PostgreSQL
assertSameTenant()     → guard multi-tenant
can(user, action)      → RBAC
Service / Repository   → lógica de negocio
writeAuditLog()        → obligatorio en mutaciones
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
│   ├── domain/          # Entidades de negocio (task, user, business, location, subscription, etc.)
│   ├── dto/             # Payloads de entrada (CreateTaskDTO, UpdateTaskDTO, etc.)
│   ├── ui/              # Tipos de estado UI (KanbanDragState, KanbanUIFilters, forms.ui.ts)
│   ├── api/             # Tipos de respuesta HTTP (PaginatedResponse, etc.)
│   └── index.ts         # Re-exporta todo
│
├── lib/
│   ├── firebase/        # Auth (client.ts, admin.ts, auth.ts) — NO Firestore
│   ├── prisma.ts        # Singleton PrismaClient (importar siempre desde aquí)
│   ├── mercadopago/
│   │   ├── plans.ts         # Definición estática de planes (fallback)
│   │   ├── plan-config.ts   # Lee PlanConfig desde DB + fallback a plans.ts
│   │   └── preapproval.ts   # Integración con MP Preapproval API
│   ├── cloudinary/      # Upload de archivos (server-side)
│   ├── groq/            # Cliente Groq, transcripción + extracción de tareas
│   ├── mail/            # Templates React Email + cliente Resend
│   ├── api/             # Helpers de API routes
│   │   ├── auth-helpers.ts  # requireUser(), requireRole()
│   │   ├── audit.ts         # writeAuditLog()
│   │   └── billing.ts       # billingApi (browser) — getPlans(), createPreapproval(), etc.
│   ├── permissions/     # RBAC: matrix.ts, resolve.ts, tenant-guard.ts
│   ├── constants/       # Labels, colores, ROLE_LEVEL
│   └── utils/           # cn(), date, format, string
│
├── repositories/
│   ├── interfaces/      # Contratos TypeScript (ITaskRepository, etc.)
│   ├── prisma/          # Implementaciones Prisma (PostgreSQL) — implementación activa
│   ├── firebase/        # Implementaciones alternativas (legacy)
│   └── index.ts         # Singletons exportados — SIEMPRE importar desde aquí
│
├── services/            # Lógica de negocio
│   ├── task.service.ts
│   ├── team.service.ts
│   ├── auth.service.ts
│   ├── location.service.ts
│   └── mail.service.ts
│
├── hooks/
│   ├── auth-context.tsx / protected-route.tsx
│   ├── queries/         # React Query — lectura (use-tasks-query, use-members-query, etc.)
│   └── mutations/       # React Query — escritura (use-create-task, use-create-user, etc.)
│
├── stores/              # Zustand — SOLO estado UI efímero
│   ├── kanban-ui.store.ts
│   ├── scrum-ui.store.ts
│   └── team-ui.store.ts
│
├── components/
│   ├── ui/              # Componentes base (Avatar, Badge, Button, Dialog, Input, etc.)
│   ├── layout/          # Sidebar, Header
│   ├── tareas/          # KanbanBoard, KanbanCard, modales (create/detail/dictate)
│   ├── equipo/          # MemberCard, CreateUserModal
│   ├── billing/         # BillingPlanCards, invoices
│   ├── roles/           # PermissionGrid, RoleEditorDrawer
│   ├── superadmin/      # SuperadminSidebar
│   └── calendario/      # CalendarView
│
└── app/
    ├── (auth)/              # Login, Register
    ├── (superadmin)/        # Panel TecnoFusión
    │   └── superadmin/
    │       └── planes/      # Edición de precios y límites de planes
    ├── dashboard/           # App principal (tareas, equipo, sectores, billing, config)
    └── api/
        ├── planes/          # GET público — planes efectivos desde DB
        ├── superadmin/planes/ # GET+PATCH — edición de planes (superadmin only)
        ├── users/create/    # POST — crea usuario + verifica límite de plan
        ├── mercadopago/     # preapproval, webhook, cancel, sync, recover
        ├── business/        # subscription, invoices
        └── ...              # tasks, members, locations, auth, upload
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

5. Repositorio persiste en PostgreSQL
   → prisma.task.create({ data: payload })    [lib/prisma.ts]

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

### Cambiar Prisma por otro ORM
1. Crear `src/repositories/drizzle/task.repository.ts` implementando `ITaskRepository`
2. Cambiar `src/repositories/index.ts` para exportar las nuevas instancias
3. **Nada más cambia** — services, hooks, stores, components son idénticos

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
