# Sectores — acciones de fila claras

## Goal

En la tabla de sedes/sectores, separar acciones frecuentes y peligrosas en íconos visibles, sin mezclar Archivar y Eliminar en un solo diálogo.

## UX

Columna **Acciones** (por fila):

| Control | Acción |
|---------|--------|
| Ícono lápiz | Editar (abre `SectorModal`) |
| Ícono archivo (ámbar) | Archivar → diálogo solo archivar |
| Ícono basura (rojo) | Eliminar → diálogo solo eliminar |
| `⋯` | Ver detalle, miembros, pendientes, finalizadas |

- Clic en fila (fuera de acciones) sigue abriendo detalle.
- Tooltips / `aria-label` en cada ícono.
- Si la sede ya está `closed`, ocultar o deshabilitar Archivar.

## Diálogos (página)

1. **Archivar** — texto: pasa a cerrado, oculta tareas activas. Botón confirmar Archivar.
2. **Eliminar** — texto: borra sede + tareas asociadas. Botón destructivo Eliminar.

Sin API nueva: reutiliza `useUpdateLocation` (`status: 'closed'`) y `useDeleteLocation`.

## Fuera de alcance

- Multi-select / bulk
- Asignar miembros desde la fila (sigue link a Equipo)

## Docs

Actualizar `docs/frontend.md` (sección Sectores / tabla).
