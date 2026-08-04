# CLAUDE.md

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Tablero de Control

SaaS multi-tenant de gestión de tareas y proyectos (Jira + Trello + Toki). Empresa dueña: TecnoFusión (superadmin).

## Stack
- **Next.js 16** App Router + React 19 + TypeScript strict
- **Auth**: Firebase (`gestordetrabajo`) — Auth + FCM
- **DB**: PostgreSQL + Prisma ORM (`@prisma/adapter-pg`)
- **Estado client**: Zustand 5 | **Estado server**: React Query 5
- **UI**: Tailwind CSS 4 + Radix UI (shadcn/ui)
- **Tests**: Vitest 4 + Testing Library + jsdom
- **AI**: Groq SDK (Whisper Large V3 Turbo + LLM)
- **Archivos**: Cloudinary | **Emails**: Resend / Gmail SMTP | **Pagos**: MercadoPago

## Comandos de desarrollo
```bash
npm run dev:all        # Firebase Emulators + Next.js
npm run seed:pg        # Datos de prueba PostgreSQL
npm run test:run       # Todos los tests
./node_modules/.bin/vitest run src/test/api-tasks.test.ts
npm run type:check
npm run check          # lint + tipos + tests (pre-commit)
```

## Jerarquía de roles
```
superadmin  → TecnoFusión — acceso total
admin       → Admin de un negocio
responsable → Responsable de local/sector
miembro     → Trabaja dentro de un local
viewer      → Solo lectura
```
Custom roles (`CustomRole`) con `PermissionSet` granular — almacenados en **Firestore** (`businesses/{id}/roles`), no en Prisma. Ver `docs/permissions.md`.

## Arquitectura en capas
```
API Route (src/app/api/**/route.ts)
  └─ requireUser()          → src/lib/api/auth-helpers.ts
  └─ assertSameTenant()     → src/lib/permissions/tenant-guard.ts
  └─ can(user, action)      → src/lib/permissions/matrix.ts
  └─ Service                → src/services/*.service.ts
       └─ Repository        → src/repositories/index.ts (singletons)
  └─ writeAuditLog()        → src/lib/api/audit.ts
```

## Workflow obligatorio

**Antes de trabajar en cualquier área:** leer el doc correspondiente de la tabla abajo.  
**Después de cambiar cualquier cosa en el sistema:** actualizar el doc correspondiente para que quede sincronizado.  
**Antes de tocar billing, tasks, permisos o integraciones:** leer también `docs/decisions/` — puede haber una decisión que afecte cómo implementar.

### Workflow Git

```
trabajar en dev → verificar/aprobar → actualizar docs/ → push → Vercel redeploy
```

1. **Todo el desarrollo sucede en `dev`** — nunca commitear directo a `test` o `main` sin flujo acordado.
2. **Antes de promover a prod/test:**
 - Verificar que el cambio funciona (`npm run check`)
 - **Actualizar el doc correspondiente en `docs/`** para reflejar el cambio
 - Si la decisión es importante → crear nuevo ADR en `docs/decisions/`
 - Commit con docs incluidos en el mismo PR
3. **Deploy web:** Vercel (`tablero-control`). Postgres puede seguir en Railway.
4. Nunca promover sin docs actualizados. Ver `docs/deploy.md`.

## Docs por dominio

| Área | Archivo |
|------|---------|
| Tasks, Kanban, Agenda, Sprints | `docs/tasks.md` |
| Auth, RBAC, permisos, tenant guards | `docs/permissions.md` |
| Billing, MercadoPago, planes | `docs/billing.md` |
| API routes — referencia completa | `docs/api-routes.md` |
| Groq, Cloudinary, Firebase, Email | `docs/integrations.md` |
| Prisma schemas — todos los modelos | `docs/models.md` |
| Stores Zustand, layout, onboarding | `docs/frontend.md` |
| Tests — patrones, mocks, archivos | `docs/testing.md` |
| Deploy Vercel, env vars | `docs/deploy.md` |
| Superadmin panel, planes, suspender negocios | `docs/superadmin.md` |
| Setup local, Prisma, credenciales seed | `docs/development.md` |

## Decisiones de arquitectura

`docs/decisions/` — una decisión por archivo. Leer antes de tocar las áreas relacionadas. Si se toma una nueva decisión importante, crear un nuevo ADR ahí.

## Reglas críticas

- Server Components por defecto — `'use client'` solo cuando necesario
- Firebase client SDK **solo** en `'use client'`; Admin SDK **solo** server/API routes
- `@/` para todos los imports internos
- `cn()` de `@/lib/utils` para clases Tailwind condicionales
- No usar `any` en TypeScript
- Prisma singleton: `src/lib/prisma.ts`
- Repositories: singletons desde `src/repositories/index.ts`
- `writeAuditLog()` obligatorio después de CREATE/UPDATE/DELETE
- Notificaciones: siempre `src/lib/notifications.ts` (DB + FCM en una llamada)
- Cambios de status de tarea: `useMoveTask` — activa lógica de recurrencia
- Cross-tenant en arrays de IDs: validar `businessId` antes de operar
