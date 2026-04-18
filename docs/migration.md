# Migración — Firestore → PostgreSQL + Railway

> Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` completado

---

## Contexto

Migración de **Firestore** a **PostgreSQL** manteniendo Next.js fullstack y Firebase Auth.

**Motivos**:
- Queries relacionales complejas (reportes, filtros cruzados) son difíciles en Firestore
- PostgreSQL da control total sobre la estructura de datos
- Railway hostea Postgres + Next.js en un solo lugar
- Vercel Pro cuesta USD 20/mes

**Lo que NO cambia**:
- Firebase Auth — login, sesiones, tokens
- Next.js con API routes — misma estructura
- Cloudinary — storage de archivos
- MercadoPago — pagos y suscripciones

---

## Stack final

| Capa | Antes | Después |
|------|-------|---------|
| Hosting | Vercel | Railway |
| Base de datos | Firestore | PostgreSQL (Railway) |
| ORM | — | Prisma |
| Auth | Firebase Auth | Firebase Auth (igual) |
| Storage | Firebase Storage → Cloudinary | Cloudinary |
| Pagos | MercadoPago | MercadoPago (igual) |

---

## Estado global

| Fase | Estado | Notas |
|------|--------|-------|
| 1. Prisma setup + schema | `[ ]` | |
| 2. Cliente Prisma + repositorios | `[ ]` | |
| 3. Migrar API routes | `[ ]` | |
| 4. Migrar hooks/queries del frontend | `[ ]` | |
| 5. Deploy Railway | `[ ]` | |
| 6. Seed datos en producción | `[ ]` | |
| 7. Testing completo | `[ ]` | |

---

## Fase 1 — Prisma setup + schema

### Instalar dependencias

```bash
npm install prisma @prisma/client
npx prisma init
```

Configurar `DATABASE_URL` en `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/tablero_control"
```

### Schema completo

Ver `prisma/schema.prisma` en el repo.

**Tablas principales**:
- `User` — perfil extendido (uid = Firebase Auth uid)
- `Business` — negocio/empresa
- `Location` — local o sede
- `Team` — equipo dentro de un local
- `TeamMember` — relación User ↔ Team
- `Project` — proyecto dentro de un equipo
- `Task` — tarea dentro de un proyecto
- `Subtask` — subtarea de una tarea
- `Comment` — comentario en una tarea
- `Attachment` — adjunto de Cloudinary en una tarea
- `Subscription` — suscripción MercadoPago del Business
- `Invoice` — factura de pago
- `AuditLog` — registro de acciones críticas

### Comandos Prisma

```bash
npx prisma migrate dev --name init     # Crear primera migración
npx prisma migrate deploy              # Aplicar en producción
npx prisma studio                      # UI visual de la BD
npx prisma generate                    # Regenerar cliente tras cambios
```

- [ ] Instalar `prisma` y `@prisma/client`
- [ ] `npx prisma init`
- [ ] Escribir `prisma/schema.prisma` completo
- [ ] `npx prisma migrate dev --name init`
- [ ] Verificar tablas en `npx prisma studio`

---

## Fase 2 — Cliente Prisma + repositorios

### Crear `src/lib/prisma.ts`

Singleton del cliente para no crear múltiples conexiones en dev:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Crear repositorios Prisma

Estructura en `src/repositories/prisma/`:
- `user.repository.ts` — reemplaza `firebase/user.repository.ts`
- `task.repository.ts` — reemplaza `firebase/task.repository.ts`
- `team.repository.ts` — reemplaza `firebase/team.repository.ts`
- `location.repository.ts` — reemplaza `firebase/location.repository.ts`
- `business.repository.ts` — nuevo
- `project.repository.ts` — nuevo

Cada uno implementa la misma interfaz `IXxxRepository` — los services no cambian.

### Actualizar `src/repositories/index.ts`

Cambiar los singletons de Firebase a Prisma:
```typescript
// Antes
export const userRepository = new FirebaseUserRepository()
// Después
export const userRepository = new PrismaUserRepository()
```

- [ ] Crear `src/lib/prisma.ts`
- [ ] Crear `src/repositories/prisma/user.repository.ts`
- [ ] Crear `src/repositories/prisma/task.repository.ts`
- [ ] Crear `src/repositories/prisma/team.repository.ts`
- [ ] Crear `src/repositories/prisma/location.repository.ts`
- [ ] Crear `src/repositories/prisma/business.repository.ts`
- [ ] Crear `src/repositories/prisma/project.repository.ts`
- [ ] Actualizar `src/repositories/index.ts`

---

## Fase 3 — Migrar API routes

Las API routes usan Firebase Admin para leer/escribir datos. Hay que cambiarlas a Prisma.

### Rutas a migrar

| Ruta | Cambio |
|------|--------|
| `api/users/create/route.ts` | Firestore → `prisma.user.create()` |
| `api/superadmin/businesses/route.ts` | Firestore → `prisma.business.findMany()` |
| `api/superadmin/metrics/route.ts` | Firestore → queries Prisma |
| `api/mercadopago/webhook/route.ts` | Firestore → `prisma.subscription.update()` |
| `api/mercadopago/preapproval/route.ts` | Firestore → `prisma.subscription.create()` |
| `api/mercadopago/cancel/route.ts` | Firestore → `prisma.subscription.update()` |

**Auth de las rutas**: Firebase Admin `verifyIdToken()` se mantiene igual — solo cambia la parte de datos.

- [ ] Migrar `api/users/create/route.ts`
- [ ] Migrar `api/superadmin/businesses/route.ts`
- [ ] Migrar `api/superadmin/metrics/route.ts`
- [ ] Migrar `api/mercadopago/webhook/route.ts`
- [ ] Migrar `api/mercadopago/preapproval/route.ts`
- [ ] Migrar `api/mercadopago/cancel/route.ts`

---

## Fase 4 — Migrar hooks/queries del frontend

El frontend usa hooks que llaman directamente a Firestore client-side. Hay que convertirlos a llamadas `fetch` a las API routes.

**Regla**: Firestore client SDK (`onSnapshot`, `getDoc`, `getDocs`) → `fetch('/api/...')` + React Query.

- [ ] Migrar `hooks/queries/use-tasks-query.ts`
- [ ] Migrar `hooks/queries/use-members-query.ts`
- [ ] Migrar `hooks/queries/use-locations-query.ts`
- [ ] Migrar `hooks/mutations/` (create, update, delete, move)
- [ ] Eliminar imports de `firebase/firestore` en componentes cliente
- [ ] Eliminar `src/lib/firebase/firestore.ts` (ya no se necesita)

---

## Fase 5 — Deploy Railway

Ver [deploy.md](deploy.md) para el paso a paso completo.

Resumen:
- Crear proyecto en Railway
- Agregar servicio PostgreSQL
- Conectar repo GitHub → Next.js detectado automáticamente
- Cargar env vars (Firebase, MP, Cloudinary, DATABASE_URL)
- Build command: `npx prisma generate && npm run build`
- Start command: `npm start`
- Correr migraciones: `npx prisma migrate deploy`

---

## Fase 6 — Seed en producción

- [ ] Crear script `scripts/seed-production.ts`
- [ ] Crear superadmin en Firebase Auth + perfil en Postgres
- [ ] Crear Business de TecnoFusión
- [ ] Verificar acceso con superadmin

---

## Fase 7 — Testing completo

Ver checklist completo en [deploy.md](deploy.md) Fase 5.

---

## Notas

- **Firebase Auth no se toca**. `verifyIdToken()` sigue funcionando en las API routes.
- **Firestore se desactiva progresivamente** — no borrar hasta que todo esté en Postgres.
- **Realtime**: Firestore `onSnapshot` se pierde. Si hay componentes que usan realtime, migrar a polling con React Query `refetchInterval` o SSE.
- **Cloudinary**: ya implementado, no cambia nada.
- **No hay Express separado** — Next.js API routes siguen siendo el backend.
