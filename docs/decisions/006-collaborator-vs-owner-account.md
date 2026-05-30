# ADR 006: Cuenta colaborador vs. dueño de negocio

## Estado

Aceptado — 2026-05-30

## Contexto

Los usuarios que entran por link de invitación (`/i/{token}`) solo deben unirse al negocio del invitador. La creación automática de un negocio en `GET /api/auth/profile` o en login (auto-registro) generaba confusión: aparecían dos equipos en el selector sin haber pedido un negocio propio.

## Decisión

1. **Colaborador por invite**: `POST /api/invites/{token}/accept` provisiona usuario (si falta) y membresía; `preferences.accountIntent = 'collaborator'`. No se crea `Business` en accept ni en profile.
2. **Profile**: Si hay membresías activas, reasignar `businessId` desde la primera activa. Si no hay membresías → `404 not_invited`. Auto-crear negocio solo para emails en `SUPERADMIN_EMAILS` sin fila en DB.
3. **Dueño**: Alta explícita vía `/register` + `POST /api/auth/register` (`accountIntent: 'owner'`) o opt-in `POST /api/businesses` (UI en Config y switcher).
4. **Auth client**: Sin `autoRegister` en `auth-context` ni en login Google; `ProtectedRoute` requiere objeto `user` de PostgreSQL.

### Ubicación UX (Armar tu negocio)

| Momento | Dónde |
|---------|--------|
| Invitación | Solo **Unirme al equipo** — sin formulario de negocio |
| Primer negocio propio (opt-in) | **Configuración → Mi perfil** — `create-own-business-card.tsx` (principal) |
| Atajo en header | Selector de empresa → **Armar tu negocio** → `/dashboard/config` si `!hasOwnedBusiness` |
| Negocios adicionales | Selector → **Armar otro negocio** → `/register?newBusiness=true` |

Onboarding tour omite pasos Equipo y Facturación para usuarios con `!isOwner` en el negocio activo.

## Migración de datos legacy

Negocios **"Empresa de {nombre}"** creados antes del fix para usuarios invitados se eliminan con:

`scripts/cleanup-invite-phantom-businesses.ts` (`npm run cleanup:invite-phantom-businesses`, flag `--execute`).

En Railway (mayo 2026): 2 negocios fantasma eliminados; 0 candidatos en verificación posterior. Dev y test usan la misma `DATABASE_URL`.

## Consecuencias

- Login sin invitación ni registro previo muestra mensaje `notInvited` con enlace a `/register`.
- Colaboradores pueden crear negocio propio después desde Config sin dejar el equipo invitador (multi-tenant por `UserBusiness`).
- Tests: `api-auth-profile.test.ts`, `api-invites.test.ts` cubren reasignación y `accountIntent`.
- Docs: [`docs/invites-and-accounts.md`](../invites-and-accounts.md), [`docs/frontend.md`](../frontend.md), [`docs/permissions.md`](../permissions.md), [`docs/development.md`](../development.md).
