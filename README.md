# Tablero de Control

> **SaaS multi-tenant de gestión de tareas y proyectos.** Combina la simplicidad visual de Trello con la estructura de Jira: kanban por equipos, planificación por ciclos/sprints, objetivos/épicas, agenda personal inteligente y asistente IA. Diseñado para organizaciones multi-sede con control de acceso granular y facturación integrada.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js App Router | 16 |
| UI | React + TypeScript strict | 19 / TS 5 |
| Estilos | Tailwind CSS 4 + Radix UI | — |
| Estado UI | Zustand | 5 |
| Estado servidor | TanStack Query (React Query) | 5 |
| Auth | Firebase Auth | 12 (cliente) / 13 (admin) |
| Base de datos | PostgreSQL + Prisma ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Archivos | Cloudinary | SDK v2 |
| Pagos | MercadoPago | Preapproval API |
| Email | Resend + React Email | — |
| IA / Audio | Groq SDK | Whisper Large V3 Turbo + LLM |
| Calendario | FullCalendar | 6 |
| Gráficos | Recharts | 3 |
| Drag & Drop | @dnd-kit | — |
| Tour guiado | driver.js | 1.x |
| Tests | Vitest 4 + Testing Library + jsdom | — |

---

---

## 🎯 Visión del Producto

**Tablero de Control** nace de la unión de dos paradigmas:
- **La simplicidad de Trello**: tableros visuales, drag & drop intuitivo, y flujos ágiles.
- **La estructura de Jira**: jerarquía organizacional, tipos de tarea, prioridades, estados de workflow, y trazabilidad completa.

El resultado es una plataforma donde un negocio puede gestionar desde tareas operativas del día a día hasta proyectos estructurados con múltiples equipos, locales y responsables — todo con control de acceso granular y facturación integrada.

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 22+
- PostgreSQL 14+ (local, Railway, o similar)
- Cuenta Firebase (solo para Auth)
- Cuenta MercadoPago (para billing en producción)

### Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Completar con tus credenciales (ver Variables de entorno más abajo)

# 3. Sincronizar base de datos y generar cliente Prisma
npx prisma db push
npx prisma generate

# 4. Cargar datos de prueba
npm run seed:pg
npm run seed:superadmin   # crea superadmin en PG

# 5. Iniciar desarrollo (Firebase Auth Emulator + Next.js)
npm run dev:all
```

Abrir [http://localhost:3000](http://localhost:3000).

### Credenciales de prueba (emulador Firebase + seed PG)

| Rol | Email | Contraseña |
|---|---|---|
| Superadmin | admin@tecnofusion.it | superadmin123 |
| Admin | admin@negocio.com | admin123 |
| Responsable | resp-local1@negocio.com | resp123 |
| Miembro | ana@negocio.com | ana123 |
| Viewer | viewer@negocio.com | viewer123 |

---

## Comandos de desarrollo

| Comando | Descripción |
|---|---|
| `npm run dev:all` | Firebase Auth Emulator + Next.js en paralelo |
| `npm run dev` | Solo Next.js |
| `npm run emulators` | Solo Firebase Auth Emulator |
| `npm run seed:pg` | Datos de prueba en PostgreSQL |
| `npm run seed:superadmin` | Crea el superadmin en PostgreSQL |
| `npm run test:run` | Tests sin watch |
| `npm run test:ui` | Tests con UI visual |
| `npm run test:coverage` | Tests con cobertura |
| `npm run type:check` | TypeScript sin compilar |
| `npm run check` | lint + tipos + tests (pre-commit) |
| `npx prisma studio` | UI visual de la base de datos |
| `npx prisma db push` | Sincroniza schema sin migración |
| `npx prisma migrate dev` | Crea y aplica migración |

---

## Arquitectura

### Capas y responsabilidades

```
components / pages
      ↓
hooks/queries + hooks/mutations     ← React Query (server state)
stores/                             ← Zustand (UI state — efímero)
      ↓
API Routes (src/app/api/**)         ← HTTP boundary
      ↓
services/                           ← lógica de negocio
      ↓
repositories/                       ← acceso a datos
      ↓
src/lib/prisma.ts                   ← singleton PrismaClient → PostgreSQL
```

Las capas externas importan de las internas, nunca al revés. `components/` no importa de `repositories/` directamente.

### Auth flow

1. Firebase Auth emite token JWT al login.
2. El cliente incluye el token: `Authorization: Bearer <token>`.
3. `requireUser()` llama `admin.verifyIdToken(token)` → obtiene `uid`.
4. `requireUser()` carga el `User` completo desde PostgreSQL.
5. La lógica usa `user.uid`, `user.role`, `user.businessId`, `user.data`.

Firebase Auth **solo autentica** — todos los datos de dominio viven en PostgreSQL.

### Multi-tenant

Cada `Business` es un tenant aislado. Reglas críticas:
- `assertSameTenant(user.data, { businessId })` — toda operación valida que el recurso pertenece al mismo negocio.
- Al asignar arrays de `taskIds` a un ciclo u objetivo, siempre validar que todas pertenecen al mismo `businessId` antes de ejecutar.
- `creatorId` en POST /tasks: solo `admin`/`superadmin` pueden especificar uno distinto al propio.

---

## Jerarquía de roles

```
superadmin  (5) → TecnoFusión — acceso total al sistema
admin       (4) → Gestiona su negocio completo
responsable (3) → Gestiona su local/sector
miembro     (2) → Opera sus tareas asignadas
viewer      (1) → Solo lectura
```

Además existen **roles custom** por negocio con `PermissionSet` granular (tasks / locations / teams / users / reports / billing / attachments). Se crean en `/dashboard/equipo/roles` y se resuelven en `src/lib/permissions/resolve.ts`.

---

## Funcionalidades

### Gestión de Tareas

- **Kanban** con 6 columnas drag & drop: Backlog → Por hacer → En progreso → En revisión → Completada → Bloqueada
- **Sprint tabs** sobre el kanban: Todas | Backlog | [Ciclo activo] | Otros — filtran tareas por ciclo server-side
- **Agenda inteligente** (`/dashboard/tareas/agenda`) — clasifica tareas en secciones por urgencia con scoring automático (prioridad + estado + asignación + horas vencidas). Actualiza cada 60 segundos.
- **Calendario** (`/dashboard/tareas/calendario`) — FullCalendar mes/semana/lista con drag & drop de fechas y proyección de recurrencias
- **Cronograma / Gantt** (`/dashboard/tareas/cronograma`) — timeline por tarea
- **Subtareas** jerarquizadas (parentId)
- **Recurrencia** configurable (diaria/semanal/mensual/personalizada) — al completar una tarea recurrente el sistema crea automáticamente la siguiente ocurrencia
- **Archivos adjuntos** vía Cloudinary (WebP, max 1000px)
- **Comentarios** con menciones @usuario y notificaciones
- **Registro de tiempo** por tarea
- **Selección múltiple** con acciones bulk (mover, eliminar)
- **Filtros** por texto, prioridad, local, proyecto, ciclo, objetivo

### Asistente IA

Botón ✨ flotante (abajo a la derecha) en todo el dashboard:
- **Dictado por voz** → Groq Whisper Large V3 Turbo transcribe el audio
- **Texto libre** → LLM extrae título, prioridad, estado, asignados, fecha, hora, tags, recurrencia y horas estimadas
- **Chat** con el asistente para consultas y creación de tareas

### Planificación

- **Ciclos / Períodos** (`/dashboard/planificacion`) — sprints de trabajo con estados: Planificación → Activo → Completado → Cerrado. Solo un ciclo activo simultáneo.
- **Objetivos** (`/dashboard/planificacion/objetivos`) — épicas / OKRs con progreso 0–100% calculado por tareas vinculadas

### Eventos

- **Eventos de calendario** (`/dashboard/eventos`) — reuniones, hitos y recordatorios que no son tareas

### Equipo

- Invitación por email o link (con vencimiento y límite de usos)
- Creación directa de usuarios (admin)
- Roles base + roles custom con permisos granulares
- Sectores/locales con responsable asignado

### Facturación

- 4 planes: Free · Basic · Pro · Enterprise
- Precios dinámicos editables por superadmin sin deploy
- Suscripciones recurrentes vía MercadoPago Preapproval
- Historial de facturas
- Límites por plan: usuarios, locales, proyectos, adjuntos

### Superadmin (TecnoFusión)

Panel exclusivo en `/superadmin`:
- KPIs globales: negocios activos, MRR, usuarios
- Gestión de negocios (activar / suspender)
- Gestión de usuarios
- Edición de precios y límites de planes
- Logs de auditoría global

### Onboarding

- **Tour guiado** (driver.js) que se lanza automáticamente en el primer login
- Se puede relanzar desde cualquier página: botón "Ver tour" en `/dashboard/ayuda` o importando `startOnboardingTour()` desde `@/components/layout/onboarding-tour`
- **Centro de ayuda** (`/dashboard/ayuda`) — acordeón por sección con descripción de cada módulo

### Notificaciones

- Push via Firebase Cloud Messaging (FCM)
- In-app con campana en el header
- Tipos: tarea asignada, tarea actualizada, mención, info general

---

## Variables de entorno

```env
# PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/tablero_control

# Firebase Client (público — NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=        # Para push notifications
NEXT_PUBLIC_USE_EMULATOR=true          # false en producción

# Firebase Admin (secreto — JSON completo en una línea)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Groq (IA)
GROQ_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# MercadoPago
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_MP_PUBLIC_KEY=

# Resend (email)
RESEND_API_KEY=

# Superadmin
SUPERADMIN_EMAILS=tu@email.com         # Coma-separated, auto-provisiona como superadmin
```

---

## Rutas de la aplicación

```
/                          # Landing page pública
/(auth)/
  /login                   # Inicio de sesión
  /register                # Registro (solo invitación o superadmin)
  /forgot-password

/i/[token]                 # Aceptar invitación por link

/dashboard/                # App principal (requiere auth)
  /                        # Dashboard con KPIs
  /tareas                  # Kanban board (vista principal)
  /tareas/agenda           # Agenda inteligente con scoring
  /tareas/calendario       # FullCalendar mes/semana/lista
  /tareas/cronograma       # Vista Gantt
  /eventos                 # Eventos de calendario del negocio
  /planificacion           # Ciclos/Períodos de trabajo
  /planificacion/objetivos # Objetivos / OKRs
  /equipo                  # Gestión de miembros
  /equipo/sectores         # Sectores/locales
  /equipo/roles            # Roles personalizados
  /reportes                # Reportes y métricas
  /billing                 # Facturación y planes
  /config                  # Configuración del negocio
  /ayuda                   # Centro de ayuda + tour

/superadmin/               # Panel TecnoFusión (solo superadmin)
  /                        # KPIs globales
  /businesses              # Gestión de negocios
  /users                   # Usuarios del sistema
  /subscriptions           # Suscripciones
  /planes                  # Editar precios y límites
  /audit                   # Logs de auditoría
```

---

## API Routes principales

```
/api/auth/profile          GET    — auto-provisiona User en PG desde Firebase UID
/api/tasks                 GET    — lista con filtros (cycleId, noCycle, projectId, businessId...)
                           POST   — crear tarea
/api/tasks/[id]            PATCH  — actualizar / mover
                           DELETE — eliminar
/api/tasks/from-audio      POST   — Groq Whisper → extracción LLM
/api/tasks/from-text       POST   — extracción LLM desde texto
/api/cycles/[id]/tasks     POST   — asignar/remover tareas (valida cross-tenant)
/api/objectives/[id]/tasks POST   — asignar/remover tareas (valida cross-tenant)
/api/members               GET, POST, PATCH /[id], DELETE /[id]
/api/users/create          POST   — crea usuario (enforcement límite por plan → 429)
/api/mercadopago/preapproval POST — inicia checkout MP
/api/mercadopago/webhook   POST   — recibe eventos MP (HMAC validado)
/api/planes                GET    — planes efectivos desde DB (público)
/api/superadmin/**         —      — endpoints superadmin (requieren role=superadmin)
/api/cron/subscription-expiry POST — verifica suscripciones vencidas
```

---

## Testing

```bash
npm run test:run                                        # Todos los tests
npx vitest run src/test/api-tasks.test.ts              # Un archivo
npm run test:coverage                                   # Con cobertura
```

Convenciones: `api-*.test.ts` para routes, `hooks-*.test.ts` para hooks, `*.test.tsx` para componentes. Ver `docs/testing.md` para patrones de mocks y fixtures.

---

## Deploy

Ver `docs/deploy.md` para el plan completo en Railway.

```
App: Railway (Next.js)
BD:  PostgreSQL (Railway plugin — DATABASE_URL automático)
Auth: Firebase Auth (proyecto gestordetrabajo)
CDN: Cloudinary
```

Build command para Railway:
```bash
npx prisma generate && npx prisma migrate deploy && npm run build
```

---

- [docs/architecture.md](docs/architecture.md) — Arquitectura y stack
- [docs/development.md](docs/development.md) — Setup y comandos
- [docs/billing.md](docs/billing.md) — Facturación y planes
- [docs/permissions.md](docs/permissions.md) — Roles y permisos
- [docs/user-guide.md](docs/user-guide.md) — Guía para usuarios finales
- [docs/functional/SCOPE_AND_REQUIREMENTS.md](docs/functional/SCOPE_AND_REQUIREMENTS.md) — Requerimientos funcionales
- [docs/functional/GLOSSARY_AND_MODELS.md](docs/functional/GLOSSARY_AND_MODELS.md) — Glosario y modelos
- [docs/functional/TRACEABILITY_MATRIX.md](docs/functional/TRACEABILITY_MATRIX.md) — Trazabilidad RF → código

| Documento | Descripción |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Stack, capas, estructura de carpetas, flujos |
| [docs/development.md](docs/development.md) | Setup, comandos, credenciales |
| [docs/testing.md](docs/testing.md) | Patrones de test, mocks, fixtures |
| [docs/permissions.md](docs/permissions.md) | RBAC, roles custom, tenant guard |
| [docs/billing.md](docs/billing.md) | Planes, MercadoPago Preapproval, límites |
| [docs/superadmin.md](docs/superadmin.md) | Operaciones del superadmin TecnoFusión |
| [docs/deploy.md](docs/deploy.md) | Deploy a Railway |
| [docs/user-guide.md](docs/user-guide.md) | Guía de uso para administradores y miembros |
| [docs/contributing.md](docs/contributing.md) | Convenciones, flujo de branches, PR checklist |
| [docs/functional/SCOPE_AND_REQUIREMENTS.md](docs/functional/SCOPE_AND_REQUIREMENTS.md) | Requerimientos funcionales |
| [docs/functional/GLOSSARY_AND_MODELS.md](docs/functional/GLOSSARY_AND_MODELS.md) | Glosario y modelos de dominio |
| [docs/functional/TRACEABILITY_MATRIX.md](docs/functional/TRACEABILITY_MATRIX.md) | Trazabilidad RF → código |

---

## Licencia

Private — Propiedad de TecnoFusión.
