# Guía operativa del Superadmin

## Crear el superadmin inicial

1. Agregar el email en `.env.local`:
   ```
   SUPERADMIN_EMAILS=tecnofusion.it@gmail.com
   ```
2. Registrarse en `/register` con ese email.
3. `GET /api/auth/profile` auto-provisiona el User en PostgreSQL con `role: 'superadmin'`.
4. Login redirige automáticamente a `/superadmin`.

### Superadmin del sistema vs rol en la empresa

- **Superadmin (sistema):** operador de TecnoFusión. Se define por `SUPERADMIN_EMAILS` y `User.role = superadmin`. Acceso a `/superadmin` y APIs `platform.*`.
- **Administrador (empresa):** rol en `UserBusiness` / equipo (`admin`, `responsable`, `miembro`, `viewer`). Solo permisos dentro de un negocio.

Editar el rol en **Equipo → Editar miembro** no quita el superadmin del sistema; solo cambia la membresía del negocio.

### Recuperar superadmin si se perdió

1. Confirmar `SUPERADMIN_EMAILS=tecnofusion.it@gmail.com` (o tu email) en `.env.local` / Vercel.
2. Cerrar sesión y volver a entrar (`GET /api/auth/profile` restaura `User.role`).
3. Opcional en DB: `UPDATE "User" SET role = 'superadmin' WHERE email = 'tu@email.com';` y `UserBusiness.role = 'admin'` donde figure `superadmin`.

## Panel superadmin

URL: `/superadmin` — accesible con `isPlatformSuperAdmin` (email en allowlist o `User.role = superadmin`).

### Secciones

| Ruta | Función |
|------|---------|
| `/superadmin` | KPIs: negocios activos, usuarios, MRR, tareas |
| `/superadmin/businesses` | Listado de negocios, suspender/reactivar |
| `/superadmin/businesses/[id]` | Detalle: usuarios, locales, suscripción |
| `/superadmin/users` | Todos los usuarios (solo lectura) |
| `/superadmin/subscriptions` | Estado de suscripciones MP |
| `/superadmin/audit` | Log de auditoría (últimas 200 acciones) |
| `/superadmin/planes` | Editar precios y límites de cada plan |

## Gestión de planes (`/superadmin/planes`)

Permite editar precios y límites de los 4 planes sin necesidad de deploy.

### Cómo funciona

Los datos se guardan en la tabla `PlanConfig` (PostgreSQL). Si una fila no existe para un `planId`, el sistema usa los valores hardcodeados en `src/lib/mercadopago/plans.ts` como fallback.

**Helper server-side:** `src/lib/mercadopago/plan-config.ts`
```ts
getEffectivePlanConfig(planId)       // un plan
getAllEffectivePlanConfigs()          // los 4 planes
```

**API:**
- `GET  /api/superadmin/planes`  → lista planes efectivos (superadmin only)
- `PATCH /api/superadmin/planes` → body `{ planId, priceMonthly, priceYearly, limitUsers, limitLocations, limitProjects, limitAttachments }` — guarda en DB + escribe AuditLog

### Campos editables

| Campo | Tipo | Notas |
|-------|------|-------|
| `priceMonthly` | Float | Precio ARS/mes. `0` = gratis |
| `priceYearly` | Float | Precio ARS/año |
| `limitUsers` | Int | `-1` = ilimitado |
| `limitLocations` | Int | `-1` = ilimitado |
| `limitProjects` | Int | `-1` = ilimitado |
| `limitAttachments` | Int | Adjuntos/mes. `-1` = ilimitado |

### Seed inicial

```bash
npx tsx prisma/seed-plan-config.ts
```

Crea las 4 filas con los valores base (free=gratis, basic=$15k, pro=$30k, enterprise=$99k ARS/mes).

## Suspender un negocio

1. Ir a `/superadmin/businesses`.
2. Clickear **Suspender** en la fila del negocio.
3. PostgreSQL actualiza `business.status = 'suspended'`.
4. Las API routes rechazan operaciones de tenants suspendidos.
5. La acción queda registrada en la tabla `AuditLog`.

## Reactivar un negocio

1. Ir a `/superadmin/businesses`.
2. Clickear **Reactivar** — actualiza `status = 'active'`.

## Ver métricas de uso

Las métricas en `/superadmin` (página principal) muestran datos desde PostgreSQL vía `/api/superadmin/metrics`. Se refrescan con React Query (`staleTime` configurado por ruta).

## Seguridad

- El layout de `(superadmin)` redirige a `/dashboard` si el rol no es `superadmin`.
- Las API routes `/api/superadmin/*` requieren token válido con `role = 'superadmin'`.
- Toda mutación crítica (suspender, cambiar rol) escribe en `AuditLog` con IP del actor.
- El superadmin **no puede editar datos de usuario** de clientes — solo lectura.
