# Migración — Tablero de Control

> **ESTADO: PAUSADO** — Se decidió mantener Next.js + Firebase y deployar en Firebase App Hosting en lugar de migrar a Express + PostgreSQL. Ver [deploy.md](deploy.md) para el plan actual.
> Este documento se conserva como referencia si en el futuro se necesita migrar la base de datos o separar el backend.

> Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` completado

---

## Contexto

Migración desde **Next.js 16 + Firebase monolítico** hacia **Backend Express + Frontend Next.js (SPA) + PostgreSQL** desplegado en **Railway**.

**Motivos**:
- `firebase.json` configurado para export estático (`"public": "out"`), incompatible con API routes.
- Vercel Pro cuesta USD 20/mes para uso comercial.
- Se busca separación clara backend/frontend y control total sobre la base de datos.

---

## Stack final

| Capa | Tecnología |
|------|------------|
| Backend | Express + Prisma + TypeScript |
| Frontend | Next.js 16 (SPA, sin API routes) |
| Base de datos | PostgreSQL |
| Auth | JWT (`jsonwebtoken` + `bcrypt`) |
| Validación | Zod (compartido) |
| Storage | Cloudinary |
| Pagos | MercadoPago Preapproval API |
| Deploy | Railway |

---

## Estructura objetivo

```
tablero_control/
├── backend/              # Express + Prisma (nuevo)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── lib/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # Next.js actual movido acá
└── shared/               # Tipos y schemas compartidos
    └── types/
```

---

## Estado global

| Fase | Estado | Duración est. | Notas |
|------|--------|---------------|-------|
| 0. Preservar estado | `[ ]` | 15 min | |
| 1. Setup Express | `[ ]` | 1 día | |
| 2. Auth + Users | `[ ]` | 2-3 días | |
| 3. Multi-tenant | `[ ]` | 2-3 días | |
| 4. Tasks + Projects | `[ ]` | 3-4 días | |
| 5. MercadoPago | `[ ]` | 2-3 días | |
| 6. Frontend | `[ ]` | 4-5 días | |
| 7. Deploy Railway | `[ ]` | 1-2 días | |
| 8. Testing | `[ ]` | 3-5 días | |
| **Total** | | **~4-5 semanas** | |

---

## Fase 0 — Preservar estado actual

**Objetivo**: No perder el trabajo antes de empezar.

- [ ] `git status` para verificar estado
- [ ] `git add .`
- [ ] `git commit -m "chore: estado previo a migración backend Express"`
- [ ] `git push origin dev`
- [ ] `git checkout -b feature/backend-express`
- [ ] `git tag pre-migration-backup && git push --tags`

**Verificación**: `git log --oneline -5` muestra el commit nuevo, GitHub tiene la rama y el tag.

---

## Fase 1 — Setup Backend Express

**Objetivo**: Esqueleto del backend corriendo en `http://localhost:4000/health`.

- [ ] Crear carpeta `backend/`
- [ ] `npm init -y` dentro de `backend/`
- [ ] Instalar deps: `express cors helmet dotenv jsonwebtoken bcrypt zod @prisma/client`
- [ ] Instalar dev deps: `typescript tsx @types/node @types/express @types/cors @types/jsonwebtoken @types/bcrypt prisma`
- [ ] `npx tsc --init` (strict, target ES2022)
- [ ] `npx prisma init`
- [ ] Configurar `DATABASE_URL` en `backend/.env`
- [ ] Crear estructura de carpetas (`routes/`, `controllers/`, `middleware/`, `services/`, `lib/`)
- [ ] `src/index.ts` — Express app + endpoint `/health`
- [ ] `src/lib/prisma.ts` — cliente Prisma singleton
- [ ] `src/middleware/error.ts` — error handler global
- [ ] `src/middleware/auth.ts` — verificación JWT
- [ ] Scripts `dev`, `build`, `start`, `db:migrate`, `db:studio` en `package.json`

**Verificación**: `npm run dev` levanta el server, `curl http://localhost:4000/health` responde 200.

---

## Fase 2 — Auth + Users con JWT

**Objetivo**: Reemplazar Firebase Auth por JWT propio.

### Modelo Prisma

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  displayName  String?
  role         Role      @default(miembro)
  businessId   String?
  business     Business? @relation(fields: [businessId], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum Role {
  superadmin
  admin
  responsable
  miembro
  viewer
}
```

### Endpoints

- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/login` → `{ token, user }`
- [ ] `POST /api/auth/logout`
- [ ] `GET /api/auth/me`
- [ ] `POST /api/auth/forgot-password` (opcional, puede quedar para después)
- [ ] `GET /api/users`
- [ ] `POST /api/users`
- [ ] `PATCH /api/users/:id`
- [ ] `DELETE /api/users/:id`

### Referencias a reutilizar

- `src/app/api/users/route.ts` — lógica de validación y permisos
- `src/lib/api/auth-helpers.ts` — `requireUser`, `requireRole` (adaptar a JWT)
- `src/types/domain/user.ts` — mover a `shared/types/`

**Verificación**: Login por Postman retorna JWT. `GET /api/auth/me` con `Authorization: Bearer <token>` funciona. Un usuario `miembro` no puede crear usuarios.

---

## Fase 3 — Multi-tenant (Business + Locales + Teams)

**Objetivo**: Negocios, locales y equipos en PostgreSQL con aislamiento por tenant.

### Modelos Prisma

```prisma
model Business {
  id             String    @id @default(cuid())
  name           String
  ownerId        String
  subscriptionId String?
  plan           Plan      @default(free)
  planExpiresAt  DateTime?
  users          User[]
  locations      Location[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model Location {
  id         String   @id @default(cuid())
  businessId String
  name       String
  address    String?
  business   Business @relation(fields: [businessId], references: [id])
  teams      Team[]
}

model Team {
  id         String       @id @default(cuid())
  locationId String
  name       String
  members    TeamMember[]
}

enum Plan {
  free
  basic
  pro
  enterprise
}
```

### Endpoints

- [ ] `POST /api/businesses` (superadmin)
- [ ] `GET /api/businesses/:id`
- [ ] `PATCH /api/businesses/:id`
- [ ] `GET /api/businesses/:id/locations`
- [ ] `POST /api/locations`
- [ ] `POST /api/teams`
- [ ] `POST /api/teams/:id/members`

### Middleware

- [ ] `requireBusinessAccess` — admin de negocio A no puede tocar negocio B.

**Verificación**: Admin de otro negocio recibe 403 al intentar ver recursos ajenos. Superadmin ve todo.

---

## Fase 4 — Tasks + Projects + Kanban

**Objetivo**: Migrar el corazón funcional (proyectos, columnas, tareas, adjuntos).

### Modelos Prisma

```prisma
model Project {
  id          String   @id @default(cuid())
  businessId  String
  name        String
  description String?
  status      String   @default("active")
  tasks       Task[]
  columns     Column[]
  createdAt   DateTime @default(now())
}

model Column {
  id        String @id @default(cuid())
  projectId String
  name      String
  order     Int
  tasks     Task[]
}

model Task {
  id          String       @id @default(cuid())
  projectId   String
  columnId    String
  title       String
  description String?
  priority    String?
  dueDate     DateTime?
  assigneeId  String?
  order       Int
  attachments Attachment[]
  createdAt   DateTime     @default(now())
}

model Attachment {
  id        String   @id @default(cuid())
  taskId    String
  url       String
  publicId  String
  filename  String
  createdAt DateTime @default(now())
}
```

### Endpoints

- [ ] `GET /api/projects`
- [ ] `POST /api/projects`
- [ ] `GET /api/projects/:id`
- [ ] `PATCH /api/projects/:id`
- [ ] `DELETE /api/projects/:id`
- [ ] `POST /api/projects/:id/columns`
- [ ] `POST /api/tasks`
- [ ] `PATCH /api/tasks/:id` (incluye mover entre columnas)
- [ ] `POST /api/tasks/:id/attachments` (Cloudinary)

### Límites por plan

- [ ] Mover `src/lib/mercadopago/plans.ts` a `backend/src/lib/plans.ts`
- [ ] Middleware que verifique `PLANS[plan].limits` antes de crear recursos

**Verificación**: Plan Free bloquea el 3er proyecto, Plan Basic bloquea el 11vo usuario.

---

## Fase 5 — MercadoPago (Suscripciones)

**Objetivo**: Trasladar integración MP al backend Express.

### Archivos a migrar

| Actual | Destino |
|--------|---------|
| `src/lib/mercadopago/plans.ts` | `backend/src/lib/plans.ts` |
| `src/lib/mercadopago/preapproval.ts` | `backend/src/services/mercadopago.ts` |
| `src/lib/mercadopago/client.ts` | `backend/src/lib/mercadopago-client.ts` |
| `src/app/api/mercadopago/preapproval/route.ts` | `backend/src/routes/mercadopago.ts` |
| `src/app/api/mercadopago/webhook/route.ts` | `backend/src/routes/webhook.ts` |

### Modelos Prisma

```prisma
model Subscription {
  id                String             @id @default(cuid())
  businessId        String             @unique
  plan              Plan
  status            SubscriptionStatus
  mpPreapprovalId   String?
  amount            Float
  currency          String             @default("ARS")
  frequency         String
  cancelAtPeriodEnd Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

enum SubscriptionStatus {
  pending
  authorized
  paused
  cancelled
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String
  actorRole  String
  businessId String?
  action     String
  targetType String?
  targetId   String?
  metadata   Json?
  ip         String?
  createdAt  DateTime @default(now())
}
```

### Endpoints

- [ ] `POST /api/mercadopago/preapproval` → devuelve `initPoint`
- [ ] `POST /api/mercadopago/webhook` → verificar HMAC con `MP_WEBHOOK_SECRET`
- [ ] `DELETE /api/subscriptions/:id`

### Precios sugeridos (actualizar `plans.ts`)

| Plan | Mensual | Anual |
|------|---------|-------|
| Basic | $8.999 ARS | $89.990 ARS |
| Pro | $24.999 ARS | $249.990 ARS |

**Verificación**: Crear preapproval TEST → checkout → webhook actualiza suscripción a `authorized`.

---

## Fase 6 — Frontend se conecta al Backend

**Objetivo**: Next.js consume API Express, sin Firebase.

- [ ] Mover Next.js actual a `frontend/` (respetar `.git`)
- [ ] `frontend/src/lib/api/client.ts` — fetch centralizado:
  - Base URL desde `NEXT_PUBLIC_API_URL`
  - Token JWT desde `localStorage` o cookies
  - 401 → redirect a login
- [ ] Reemplazar `src/lib/firebase/auth.ts` por `src/lib/auth.ts` (llama a `/api/auth/*`)
- [ ] Actualizar `useAuth` hook → usa `/api/auth/me`
- [ ] Actualizar fetchers de React Query
- [ ] Eliminar `frontend/src/app/api/` entero
- [ ] Eliminar `frontend/src/lib/firebase/admin.ts` y usos server-side de Firebase Admin
- [ ] `frontend/.env.local`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:4000
  ```
- [ ] Eliminar `firebase.json`, `firestore.rules`, `storage.rules` de la raíz
- [ ] Evaluar si se migra Firebase Storage a Cloudinary (recomendado)

**Verificación**: Login → token guardado → dashboard carga datos vía Express → crear tarea end-to-end funciona.

---

## Fase 7 — Deploy a Railway

**Objetivo**: Backend + Frontend + PostgreSQL corriendo en producción.

### Servicios Railway

- [ ] Proyecto nuevo en https://railway.app
- [ ] Plugin PostgreSQL → copiar `DATABASE_URL`
- [ ] Servicio **Backend**:
  - Root: `backend/`
  - Build: `npm install && npx prisma generate && npm run build && npx prisma migrate deploy`
  - Start: `npm start`
  - Env: `DATABASE_URL`, `JWT_SECRET`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `CLOUDINARY_*`, `CORS_ORIGIN`
- [ ] Servicio **Frontend**:
  - Root: `frontend/`
  - Build: `npm install && npm run build`
  - Start: `npm start`
  - Env: `NEXT_PUBLIC_API_URL`

### Dominios

- [ ] `api.tudominio.com` → backend
- [ ] `app.tudominio.com` → frontend
- [ ] Actualizar `CORS_ORIGIN` con el dominio real
- [ ] Actualizar webhook MP: `https://api.tudominio.com/api/mercadopago/webhook`

**Verificación**: Login desde producción → dashboard funciona → pago MP TEST completa flujo.

---

## Fase 8 — Testing y ajustes

**Objetivo**: Validar migración completa y corregir regresiones.

### Checklist funcional

- [ ] Login / registro / logout
- [ ] Crear negocio, locales, equipos
- [ ] CRUD de usuarios con roles
- [ ] CRUD de proyectos
- [ ] Kanban: crear columnas, arrastrar tareas, asignar responsables
- [ ] Adjuntos a tareas (Cloudinary)
- [ ] Upgrade plan Free → Basic con MP
- [ ] Webhook MP actualiza suscripción
- [ ] Cancelación de suscripción
- [ ] Límites de plan respetados
- [ ] Audit log registra acciones críticas
- [ ] Responsive en mobile

### Tests automatizados

- [ ] Backend: Vitest + supertest (auth, subscriptions, límites)
- [ ] Frontend: actualizar mocks de API en tests existentes

---

## Archivos críticos de referencia

- [src/lib/mercadopago/plans.ts](src/lib/mercadopago/plans.ts) — planes y límites
- [src/lib/mercadopago/preapproval.ts](src/lib/mercadopago/preapproval.ts) — cliente MP
- [src/app/api/mercadopago/preapproval/route.ts](src/app/api/mercadopago/preapproval/route.ts) — endpoint actual
- [src/lib/api/auth-helpers.ts](src/lib/api/auth-helpers.ts) — `requireUser`, `requireRole`
- [src/lib/api/audit.ts](src/lib/api/audit.ts) — `writeAuditLog`
- [src/types/domain/](src/types/domain/) — tipos (mover a `shared/`)
- [.env.local](.env.local) — credenciales

---

## Notas

- **No borrar Firebase** hasta que la migración esté 100% completa (fallback durante transición).
- **Cloudinary** se mantiene — no requiere migración.
- **MercadoPago Preapproval** ya está bien implementada, solo cambia el entorno (Next → Express).
- La rama `dev` queda intacta. Toda la migración ocurre en `feature/backend-express`.

---

## Bitácora

> Registrá acá decisiones, bloqueos o cambios de alcance que surjan en el camino.

| Fecha | Fase | Nota |
|-------|------|------|
| 2026-04-18 | — | Documento creado |
