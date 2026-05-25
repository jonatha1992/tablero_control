# ADR-004: BusinessInvite.locationIds es array pero User tiene un solo locationId

**Estado:** accepted  
**Fecha:** 2026-05-25

## Contexto

El modelo `BusinessInvite` fue diseñado con `locationIds String[]` (array) para soportar invitaciones a múltiples sectores a la vez. Sin embargo, el modelo `User` solo tiene un campo `locationId: String?` (singular).

Esta asimetría existe porque en el futuro se planea permitir que usuarios pertenezcan a múltiples sectores, pero el modelo User todavía no soporta eso.

## Decisión

Al aceptar una invitación (`src/app/i/[token]/invite-client.tsx`):
- Se asigna `locationIds[0]` como el `locationId` del usuario
- Los otros valores en el array (si existen) se ignoran por ahora

Al crear invitaciones, no enviar más de un `locationId` hasta que el modelo User soporte múltiples sectores.

## Consecuencias

- No refactorizar BusinessInvite a `locationId: String?` — mantener el array para la futura migración
- Al aceptar invite, siempre usar `invite.locationIds[0]`
- Si en el futuro User soporta múltiples sectores, actualizar el flujo de aceptación para procesar todo el array
- Después de `accept.mutateAsync()` + `refreshProfile()`, NO redirigir automáticamente — mostrar estado de confirmación y dejar que el usuario navegue manualmente
