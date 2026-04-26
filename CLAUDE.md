# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Tablero de Control — Contexto del Proyecto

## Qué es
SaaS multi-tenant de gestión de tareas y proyectos. Cada negocio (Business) tiene sus propios locales, equipos y usuarios. La empresa dueña del sistema es TecnoFusión (superadmin).

## Stack
- **Next.js 16** App Router + React 19 + TypeScript strict
- **Auth/Storage**: Firebase (proyecto `gestordetrabajo`)
- **Base de Datos**: PostgreSQL + Prisma ORM (driver `@prisma/adapter-pg`)
- **Estado client**: Zustand 5 | **Estado server**: React Query 5
- **UI**: Tailwind CSS 4 + Radix UI (patrón shadcn/ui)
- **Tests**: Vitest 4 + Testing Library + jsdom

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

**Permisos:** `src/lib/permissions/` — `matrix.ts` (RBAC por rol), `resolve.ts` (resuelve custom roles con `PermissionSet`), `tenant-guard.ts` (`assertSameTenant` / `isSameTenant`). Todo re-exportado desde `src/lib/permissions/index.ts`.

**Audit log:** `src/lib/api/audit.ts` → `writeAuditLog()`. Llamar después de CREATE/UPDATE/DELETE en API routes.

## Estado del cliente

- **React Query**: queries en `src/hooks/queries/`, mutations en `src/hooks/mutations/`. Los query keys están co-localizados en el archivo de query (e.g. `taskKeys`). Las funciones HTTP viven en `src/lib/api/` (e.g. `tasksApi`, `membersApi`, `billingApi`).
- **Zustand stores** (`src/stores/`): solo estado UI efímero — modales abiertos, drag state, filtros de vista. Stores existentes: `kanban-ui.store.ts`, `scrum-ui.store.ts`, `team-ui.store.ts`.

## Rutas de la app

```
src/app/
├── (auth)/           # login, register — sin sidebar
├── (superadmin)/     # panel TecnoFusión — layout propio con superadmin-sidebar
├── dashboard/        # app principal — layout con Sidebar + Header
│   ├── tareas/       # Kanban board
│   ├── equipo/       # gestión de miembros
│   ├── sectores/     # gestión de locales
│   ├── calendario/
│   ├── billing/
│   └── config/
└── api/              # API routes (business/, locations/, members/, tasks/, superadmin/, etc.)
```

El layout de `dashboard/` es `'use client'` y usa `ProtectedRoute` + `useAuth()`. Las páginas dentro pueden ser Server Components.

## Tipos

Todos los tipos en `src/types/`, re-exportados desde `src/types/index.ts`:
- `domain/` — entidades del negocio (Task, User, Business, Location, etc.)
- `dto/` — payloads de entrada para API (CreateTaskDTO, UpdateTaskDTO, etc.)
- `ui/` — tipos de estado UI (KanbanDragState, KanbanUIFilters, etc.)
- `api/` — tipos de respuesta HTTP (PaginatedResponse, etc.)

`ROLE_LEVEL` también se exporta desde `src/types/index.ts` para comparación numérica de roles.

## Acceso superadmin

1. `.env.local`: `SUPERADMIN_EMAILS=email@ejemplo.com`
2. Registrarse en `/register` con ese email
3. `GET /api/auth/profile` auto-provisiona el user en PostgreSQL con `role: 'superadmin'`
4. Login y registro redirigen automáticamente a `/superadmin` (usuarios con otro rol van a `/dashboard`)

## Tests

Tests en `src/test/`. Setup en `src/test/setup.ts`. Entorno jsdom.

Nomenclatura: `api-*.test.ts` para API routes, `hooks-*.test.ts` para hooks, `*.test.tsx` para componentes.

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
- Pagos: `src/lib/mercadopago/` — `plans.ts` (definición de planes) + `preapproval.ts`; API client: `src/lib/api/billing.ts` (`billingApi`)
- Uploads: `src/lib/cloudinary/` — `upload.ts` + `config.ts`
