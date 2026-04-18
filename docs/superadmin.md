# Guía operativa del Superadmin

## Crear el superadmin inicial

1. Copiar `.env.local.example` a `.env.local` y completar:
   ```
   SUPERADMIN_EMAIL=tecnofusion.it@gmail.com
   SUPERADMIN_PASSWORD=ContraseñaSegura123!
   ```
2. Levantar emuladores: `npm run emulators`
3. Ejecutar: `npm run seed:superadmin`
4. Logearse en `/login` con las credenciales configuradas.
5. Serás redirigido a `/superadmin`.

**En producción:** correr el script apuntando al proyecto real (sin `NEXT_PUBLIC_USE_EMULATOR=true`).

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
3. Firestore actualiza `business.status = 'suspended'`.
4. Las Firestore rules bloquean escrituras del tenant suspendido (`isActiveBusiness` falla).
5. La acción queda registrada en `auditLogs`.

## Reactivar un negocio

1. Ir a `/superadmin/businesses`.
2. Clickear **Reactivar** — actualiza `status = 'active'`.

## Ver métricas de uso

Las métricas en `/superadmin` (página principal) muestran datos en tiempo real desde Firestore. Se refrescan cada 30 segundos.

## Seguridad

- El layout de `(superadmin)` redirige a `/dashboard` si el rol no es `superadmin`.
- Las API routes `/api/superadmin/*` requieren token válido con `role = 'superadmin'`.
- Toda mutación crítica (suspender, cambiar rol) escribe en `auditLogs` con IP del actor.
- El superadmin **no puede editar datos de usuario** de clientes — solo lectura.
