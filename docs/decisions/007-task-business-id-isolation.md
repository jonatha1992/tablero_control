# ADR-007: Task.businessId como fuente de aislamiento de espacios

**Estado:** accepted  
**Fecha:** 2026-06-02

## Contexto

Un mismo usuario puede pertenecer a más de un espacio/negocio y cambiar su `businessId` activo desde el selector del header. Antes, las tareas no guardaban `businessId` propio y el backend infería pertenencia por tablero, sector o `creator.businessId`.

Esa inferencia falla cuando el creador está en dos espacios: al cambiar el espacio activo del usuario, tareas sin tablero/sector podían aparecer en el espacio nuevo porque el creador ahora apuntaba a otro `businessId`.

## Decisión

`Task.businessId` es la fuente principal de aislamiento tenant para tareas.

- Las tareas nuevas se crean siempre con `businessId`.
- Las consultas por negocio filtran por `Task.businessId`.
- Las filas legacy con `businessId = null` solo hacen fallback por `project.businessId` o `location.businessId`.
- No se infiere pertenencia por `creator.businessId` ni por memberships del creador.

## Consecuencias

- Cambiar de espacio cambia correctamente el universo visible de tareas.
- Tareas legacy sin `businessId`, tablero ni sector quedan ambiguas y deben revisarse/backfillearse.
- Usar `scripts/backfill-task-business-id.ts` para completar tareas legacy cuando la pertenencia sea inferible por tablero o sector.
