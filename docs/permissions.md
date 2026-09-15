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
- Locations PATCH/DELETE: `business.locations.crud` (admin) o `canMutateLocation()` — superadmin con espacio activo, responsable en su sede asignada (solo PATCH)
- Comments DELETE: verifica ownership (miembro solo borra propios; admin/responsable borra cualquiera)
- POST /tasks con `creatorId` distinto: solo `admin` o `superadmin`

## Salir del espacio (leave business)

`POST /api/members/leave` — self-service, distinto de `DELETE /api/members/[id]` (admin-driven, self-removal sigue bloqueado con `cannot_remove_self`). Actúa sobre `user.data.businessId` (negocio activo del caller).

Códigos de error:
| Código | HTTP | Motivo |
|---|---|---|
| `no_business` | 400 | Caller sin `businessId` activo |
| `not_member` | 404 | Sin membresía activa en ese negocio |
| `cannot_leave_owner` | 403 | Caller es `business.ownerId` y no seleccionó sucesor |
| `invalid_new_owner` | 400 | Sucesor no es otro admin/superadmin activo de este negocio |
| `not_business_owner` | 403/409 | Caller sin propiedad intenta transferir, o la propiedad cambió durante la operación |
| `last_admin_cannot_leave` | 409 | Caller es admin (rol de membership `admin` o `superadmin`) y no hay otro admin activo |

No hay gate de `requireActiveSubscription` — se puede salir de un negocio con suscripción vencida.

Reglas:
- No-admins (miembro/responsable/viewer) pueden salir sin el chequeo de "último admin".
- Si el caller es `Business.ownerId`, debe enviar `{ newOwnerId }` con el ID de otro admin/superadmin activo del negocio. La ruta valida la lista de admins; el servicio vuelve a validar la membresía activa del saliente, que queda otro admin, la propiedad y la membresía/cuenta del sucesor en una transacción serializable. En esa transacción cambia `Business.ownerId` y `Business.adminId` al sucesor, reasigna los sectores gestionados por el saliente dentro del negocio y desactiva su membresía. Si hay colisión serializable, se reintenta hasta tres veces con nuevas validaciones. Si algo falla, ningún cambio se confirma. Su rol global de superadmin no cambia.
- `teamService.leaveBusiness(userId, businessId, reassignToUserId)` corre en **una sola transacción** (`prisma.$transaction`): reasigna sectores que el usuario gestiona en ese negocio (`Location.managerId`, scoped por `businessId`) a otro admin activo o al dueño del negocio (o no reasigna si no hay ninguno — `reassignToUserId` puede ser `null`), y recién ahí desactiva la membresía (`UserBusiness.isActive = false`) y limpia `user.businessId` si era el negocio activo. Reasignación + desactivación son atómicas: no puede quedar un sector apuntando a un manager ya desactivado si el proceso se corta a mitad de camino. Nunca borra locations ni tasks (a diferencia de `handleManagerDeletion`, que sí borra cuando no hay otro admin — ver más abajo).
- Tras `leaveBusiness`: `setCustomUserClaims(uid, { role, businessId: null })` no-fatal (try/catch) + `invalidateAuthedUserCache(uid)`.
- Respuesta `{ ok: true, remainingBusinesses, isPlatformSuperAdmin }`. Sin auto-switch server-side; el cliente hace hard-navigate. Para usuarios no-superadmin: `remainingBusinesses > 0` → `/dashboard` (el perfil auto-selecciona otra membership activa), `0` → `/register`.
- La respuesta también indica `isPlatformSuperAdmin`. Si es `true`, el cliente navega a `/superadmin`, incluso si no quedan memberships. `GET /api/auth/profile` conserva perfil y rol global `superadmin` sin un negocio activo; otros roles sin memberships siguen recibiendo `404 not_invited`.

**Riesgo pre-existente conocido:** `teamService.handleManagerDeletion` (usado por `DELETE /api/members/[id]` cuando se borra un admin) usa `locationRepository.bulkUpdateManagerId` / `findByManagerId` / `deleteByManagerId`, filtrados **solo por `managerId`**, sin `businessId` — un `managerId` de otro tenant podría verse afectado. `leaveBusiness` (leave-business) no tiene este problema porque siempre filtra por `businessId`. No corregido en este cambio (fuera de scope; DELETE /api/members/[id] es zona prohibida).

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

## Invitación por link (`/i/[token]`)

Resumen ampliado: [`docs/invites-and-accounts.md`](invites-and-accounts.md).

### Reglas de alta

- Alta inline en `/i/{token}`: **nombre + correo + contraseña**. El correo es obligatorio y `prepare-account` lo valida (formato + no duplicado); alternativa Google/login con redirect.
- Alta en Firebase (email, Google o registro) **sin** `POST /api/auth/register` cuando el redirect apunta a `/i/…`.
- `POST /api/invites/{token}/accept` (`src/app/api/invites/[token]/accept/route.ts`) crea o vincula el usuario en PostgreSQL y asigna `businessId` + rol del invite. Body opcional `{ username }` generado por `prepare-account`. **No** crea un `Business` propio; usuarios nuevos reciben `preferences.accountIntent: 'collaborator'` y `joinedViaInviteAt`.
- `GET /api/auth/resolve` (público): resuelve username, email o **nombre** (único) → email Firebase para login.
- `GET /api/auth/profile` (`src/app/api/auth/profile/route.ts`) **no** auto-crea negocios para colaboradores: si hay membresías activas, solo reasigna `businessId` desde la primera; sin membresías → `404 not_invited`.
- Dueño de negocio propio: registro en `/register`, `POST /api/auth/register` (`accountIntent: 'owner'`), o opt-in en Config → **Armar tu negocio** (`POST /api/businesses`).
- Login sin perfil PG y sin invitación: `notInvited` en `src/hooks/auth-context.tsx` (sin auto-registro silencioso en login Google).
- Audit: `user.join_via_invite`, `invite_link.create`.

### Componentes UI

| Componente | Ruta | Rol |
|------------|------|-----|
| Pantalla de invitación | `src/app/i/[token]/invite-client.tsx` | Formulario nombre+contraseña; signup+accept en un paso; copy anti-negocio-fantasma |
| Login | `src/app/(auth)/login/page.tsx` | Redirect a `/i/…`; sin register silencioso |
| Registro | `src/app/(auth)/register/page.tsx` | Omite negocio si `redirect` es `/i/…` |
| Auth provider | `src/hooks/auth-context.tsx` | Profile 404 → `notInvited` (fuera de register/invite) |
| Ruta protegida | `src/hooks/protected-route.tsx` | Exige `user` PG además de Firebase |
| Armar tu negocio | `src/components/config/create-own-business-card.tsx` | Primer negocio propio (Config) |
| Selector header | `src/components/business-switcher.tsx` | Atajo a Config o register según `hasOwnedBusiness` |
| Onboarding | `src/components/layout/onboarding-tour.tsx` | Sin pasos Equipo/Facturación si `!isOwner` |

### Limpieza de negocios fantasma (datos legacy)

Antes del fix, algunos invitados quedaron con un negocio **"Empresa de {nombre}"** auto-creado. Script de mantenimiento:

```bash
npm run cleanup:invite-phantom-businesses              # dry-run
npx tsx --env-file=.env.local scripts/cleanup-invite-phantom-businesses.ts --execute
```

Criterios: usuario con señal de invitación (`user.join_via_invite` o `accountIntent: collaborator`), dueño de negocio con nombre `Empresa de …`, único miembro activo de ese negocio, y membresía activa en otro negocio. Detalle en [`docs/development.md`](development.md#limpieza-de-negocios-fantasma-por-invitación).

Ver también [`docs/frontend.md`](frontend.md), ADR [`docs/decisions/006-collaborator-vs-owner-account.md`](decisions/006-collaborator-vs-owner-account.md).
