# Guía operativa del Superadmin

## Crear el superadmin inicial

1. Agregar el email en `.env.local`:
   ```
   SUPERADMIN_EMAILS=tecnofusion.it@gmail.com
   ```
2. Registrarse en `/register` con ese email.
3. `GET /api/auth/profile` auto-provisiona el User en PostgreSQL con `role: 'superadmin'`.
4. Login redirige automáticamente a `/superadmin`.

## Panel superadmin

URL: `/superadmin` — solo accesible con `role = 'superadmin'`.

### Secciones

| Ruta | Función |
|------|---------|
| `/superadmin` | KPIs: negocios activos, usuarios, MRR, tareas |
| `/superadmin/businesses` | Listado de negocios, suspender/reactivar |
| `/superadmin/businesses/[id]` | Detalle: usuarios, locales, suscripción |
| `/superadmin/users` | Todos los usuarios (solo lectura) |
| `/superadmin/subscriptions` | Estado de suscripciones MP |
| `/superadmin/audit` | Log de auditoría (últimas 200 acciones) |

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
