# Sistema de roles y permisos

## Dos planos de acceso

### Plano plataforma (TecnoFusión)
- `superadmin` — acceso total al sistema. `businessId = null`.

### Plano cliente (Business)
- `admin` — gestiona su propio negocio.
- `responsable` — gestiona su local/sector.
- `miembro` — opera tareas asignadas.
- `viewer` — solo lectura.

`ROLE_LEVEL` exportado desde `src/types/index.ts` — usar para comparación numérica de roles.

## Archivos

```
src/lib/permissions/
  matrix.ts       ← RBAC por rol (qué puede hacer cada rol)
  resolve.ts      ← resuelve custom roles con PermissionSet
  tenant-guard.ts ← assertSameTenant / assertResourceBelongsToBusiness
  index.ts        ← re-exporta todo
```

## requireUser()

`src/lib/api/auth-helpers.ts` — verifica Firebase token + carga User de PostgreSQL.

```typescript
const userOrRes = await requireUser(req);
if (userOrRes instanceof NextResponse) return userOrRes; // retornar inmediatamente si falla
const user = userOrRes;
// user.uid, user.role, user.businessId, user.data (User completo de PostgreSQL)
```

`user.data` siempre tiene `{ id, role, businessId }` — nunca asumir que está vacío.

## Guards multi-tenant

```typescript
import { assertSameTenant, assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';

// En GET que filtran por businessId:
assertSameTenant(user.data, { businessId });

// En GET/PATCH/DELETE de recurso individual:
assertResourceBelongsToBusiness(user.data, resource.businessId);
```

Ambos lanzan `TenantMismatchError` → 403.

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

## Roles custom por cliente

Admins crean roles custom en `/dashboard/equipo/roles`.
- Heredan de un rol base (`responsable`, `miembro` o `viewer`).
- Permisos granulares por módulo: `tasks/locations/teams/users/reports/billing/attachments`.
- No pueden otorgar permisos de facturación ni permisos de superadmin.
- Validados por `src/lib/permissions/validate-role.ts` antes de guardar.
- Resueltos en `src/lib/permissions/resolve.ts`.

⚠️ **CustomRole se almacena en Firestore** (`businesses/{businessId}/roles`), NO en PostgreSQL/Prisma.
- Read: `src/hooks/queries/use-roles-query.ts`
- Write: `src/hooks/mutations/use-save-role.ts` (save, delete, toggle)
- Por eso `firebase.json`, `firestore.rules` y `firestore.indexes.json` son necesarios.

## Audit Log

`src/lib/api/audit.ts` → `writeAuditLog()`. **Obligatorio después de CREATE/UPDATE/DELETE.**

Acciones auditadas:
```
business.* | user.* | role.* | subscription.* | invoice.*
task.* | attachment.* | plan_config.* | cycle.* | objective.*
project.* | comment.* | time_entry.* | invite_link.*
```

## Defensa en profundidad

1. **UI** — `can()` oculta elementos.
2. **API routes** — `requireUser()` + `assertSameTenant()` + `can()`.
3. **Cross-tenant injection** — arrays de IDs deben validarse antes de operaciones masivas:

```typescript
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

Ver decisions/003 para detalle.

## Role guards específicos en API routes

- Cycles POST/PATCH/DELETE: `task.create` / `task.update.any` / `task.delete`
- Locations PATCH/DELETE: `business.locations.crud`
- Comments DELETE: verifica ownership (miembro solo borra propios; admin/responsable borra cualquiera)
- POST /tasks con `creatorId` distinto: solo `admin` o `superadmin`

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

## Acceso superadmin

1. `.env.local`: `SUPERADMIN_EMAILS=email@ejemplo.com`
2. Registrarse en `/register` con ese email
3. `GET /api/auth/profile` auto-provisiona con `role: 'superadmin'`
4. Login redirige a `/superadmin`; otros roles → `/dashboard`
