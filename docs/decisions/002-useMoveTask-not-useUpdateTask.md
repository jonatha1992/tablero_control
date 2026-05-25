# ADR-002: Usar useMoveTask (no useUpdateTask) para cambios de status

**Estado:** accepted  
**Fecha:** 2026-05-25

## Contexto

Hay dos mutations para modificar tareas:
- `useUpdateTask` — PATCH genérico, actualiza cualquier campo
- `useMoveTask` — llama a `TaskService.moveTask()` en el backend

La diferencia crítica: `moveTask()` en el backend maneja la lógica de recurrencia. Cuando una tarea con campo `recurrence` se mueve a status `done`, `moveTask()` crea automáticamente la siguiente ocurrencia de la tarea.

Si se usa `useUpdateTask` para cambiar el status a `done`, el backend recibe un PATCH genérico y **no ejecuta la lógica de recurrencia** — la siguiente ocurrencia nunca se crea.

## Decisión

Para **cualquier cambio de status de tarea**, usar `useMoveTask`.

`useUpdateTask` solo debe usarse para cambios de otros campos (título, descripción, prioridad, fechas, etc.) donde la lógica de recurrencia no aplica.

## Consecuencias

- La recurrencia funciona correctamente en kanban drag-drop, agenda quick actions, y cualquier otro punto de cambio de status
- Si se agrega un nuevo punto en la UI donde el usuario cambia el status, debe usar `useMoveTask`
- `useUpdateTask` queda para edición de campos que no sean status
