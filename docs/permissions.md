# Sistema de roles y permisos

## Dos planos de acceso

### Plano plataforma (TecnoFusión)
- `superadmin` — acceso total al sistema. `businessId = null`.

### Plano cliente (Business)
- `admin` — gestiona su propio negocio.
- `responsable` — gestiona su local/sector.
- `miembro` — opera tareas asignadas.
- `viewer` — solo lectura.

## Matriz de permisos (base)

Ver tabla completa en `src/lib/permissions/matrix.ts`.

## Roles custom por cliente

Los admins pueden crear roles custom dentro de su business en `/dashboard/equipo/roles`.

- Heredan de un rol base (`responsable`, `miembro` o `viewer`).
- Permiten ajustar permisos por módulo con granularidad fine-grained (tasks/locations/teams/users/reports/billing/attachments).
- No pueden otorgar permisos de facturación ni permisos reservados a superadmin.
- Validados por `src/lib/permissions/validate-role.ts` antes de guardar.

## Uso en código

```typescript
import { can } from '@/lib/permissions/matrix';
import { resolvePermissions } from '@/lib/permissions/resolve';

// En componente (UI gate)
if (!can(user, 'task.create')) {
  // ocultar botón
}

// Resolver permisos efectivos (base + custom)
const perms = resolvePermissions(user, customRole);
if (perms.tasks.delete) { /* mostrar botón eliminar */ }
```

```typescript
import { assertSameTenant, assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';

// En API route — verifica que user y resource son del mismo business
assertSameTenant(user, { businessId: resource.businessId }); // lanza TenantMismatchError (403) si no coincide

// Para recursos que pertenecen a un business via join (ej: tarea dentro de ciclo)
assertResourceBelongsToBusiness(resource, user.businessId); // mismo efecto
```

## Defensa en profundidad

1. **UI** — `can()` oculta elementos.
2. **API routes** — `requireUser()` + `assertSameTenant()` + `can()`. Todo rol verificado aquí antes de llegar al service.
3. **Cross-tenant injection** — rutas que aceptan arrays de IDs (`taskIds`, etc.) deben validar que todos los recursos pertenecen al mismo `businessId` antes de ejecutar operaciones masivas. Ver patrón:

```typescript
// Validar que todas las tareas pertenecen al business del ciclo
const count = await prisma.task.count({
  where: { id: { in: taskIds }, businessId: cycle.businessId },
});
if (count !== taskIds.length) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

Implementado en:
- `src/app/api/cycles/[id]/tasks/route.ts`
- `src/app/api/objectives/[id]/tasks/route.ts`

## Custom claims en Firebase Auth

Al crear/actualizar un usuario se setean custom claims:
```json
{ "role": "admin", "businessId": "biz-123" }
```

Estos claims se usan para validación rápida en `requireUser()` — el User completo se carga desde PostgreSQL.

Al cambiar rol de un usuario:
1. Actualizar `users.role` en PostgreSQL.
2. Llamar `auth.setCustomUserClaims(uid, { role, businessId })` con Admin SDK.
3. El token del usuario se invalida al próximo refresh (forzar con `getIdToken(true)`).

## AuthedUser

`requireUser()` devuelve `AuthedUser | NextResponse`. Si es `NextResponse`, retornarlo inmediatamente:

```typescript
const userOrRes = await requireUser(req);
if (userOrRes instanceof NextResponse) return userOrRes;
const user = userOrRes;
// user.uid, user.role, user.businessId, user.data (User completo de PostgreSQL)
```

`user.data` siempre tiene `{ id, role, businessId }` — nunca asumir que está vacío.
