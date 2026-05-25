# ADR-003: Validar cross-tenant al asignar taskIds a ciclos/objetivos

**Estado:** accepted  
**Fecha:** 2026-05-25

## Contexto

Los endpoints `POST /api/cycles/[id]/tasks` y `POST /api/objectives/[id]/tasks` aceptan un array `taskIds` para asignar tareas. Sin validación, un usuario podría enviar IDs de tareas de otro business y asignarlas a su ciclo — violando el aislamiento multi-tenant.

El guard `assertSameTenant` verifica que el ciclo/objetivo pertenece al business del usuario, pero no verifica que cada tarea en `taskIds` también pertenezca a ese mismo business.

## Decisión

Antes de ejecutar la asignación, validar que **todas las tareas en `taskIds` pertenecen al mismo `businessId`** del ciclo/objetivo:

```ts
const validCount = await prisma.task.count({
  where: { id: { in: taskIds }, businessId },
});
if (validCount !== taskIds.length) {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 });
}
```

Implementado en:
- `src/app/api/cycles/[id]/tasks/route.ts`
- `src/app/api/objectives/[id]/tasks/route.ts`

## Consecuencias

- Cualquier endpoint futuro que acepte arrays de IDs de recursos debe implementar la misma validación
- Fallar con 403 (no 400) — es un intento de acceso no autorizado, no un error de validación de input
- Hacer el count **antes** de llamar al service — el service no tiene contexto del business del llamador
