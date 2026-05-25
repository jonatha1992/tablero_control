# Migración — Firestore → PostgreSQL

> Migración completada. Este documento es referencia histórica.

---

## Contexto

Migración de **Firestore** a **PostgreSQL** manteniendo Next.js fullstack y Firebase Auth.

**Motivos**:
- Queries relacionales complejas (reportes, filtros cruzados) difíciles en Firestore
- Control total sobre estructura de datos
- Railway hostea Postgres + Next.js en un solo lugar

**Lo que no cambió**:
- Firebase Auth — login, sesiones, tokens
- Next.js con API routes
- Cloudinary — storage de archivos
- MercadoPago — pagos y suscripciones

---

## Stack final

| Capa | Antes | Después |
|------|-------|---------|
| Hosting | Vercel | Railway |
| Base de datos | Firestore | PostgreSQL |
| ORM | — | Prisma (`@prisma/adapter-pg`) |
| Auth | Firebase Auth | Firebase Auth (igual) |
| Storage | Firebase Storage | Cloudinary |
| Pagos | MercadoPago | MercadoPago (igual) |

---

## Estado

| Fase | Estado |
|------|--------|
| 1. Prisma setup + schema | `[x]` |
| 2. Cliente Prisma + repositorios | `[x]` |
| 3. Migrar API routes | `[x]` |
| 4. Migrar hooks/queries del frontend | `[x]` |
| 5. Deploy Railway | `[ ]` — ver deploy.md |
| 6. Seed datos en producción | `[ ]` |
| 7. Testing completo | `[~]` — en progreso |

---

## Notas de implementación

- `src/lib/prisma.ts` — singleton `PrismaClient` (driver `@prisma/adapter-pg`)
- `src/repositories/prisma/` — implementaciones activas
- `src/repositories/firebase/` — código legacy, no usado en producción
- `src/repositories/index.ts` — exporta singletons Prisma
- Firebase Auth se mantiene: `requireUser()` verifica token Firebase, luego carga `User` desde PostgreSQL
- Firestore `onSnapshot` eliminado — frontend usa `fetch` a API routes + React Query
