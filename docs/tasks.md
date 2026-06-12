# Tasks, Kanban, Agenda, Sprint Tabs

## Modelo Task — campos completos

```
id, title, description
status (TaskStatus), priority (TaskPriority), type (TaskType)
creatorId, businessId?, projectId?, locationId?, parentId?   ← parentId queda como soporte legacy pausado
cycleId?, objectiveId?                          ← asociación a sprint/objetivo
assignees (User[]), tags (String[])
startDate?, dueDate? (DateTime — incluye hora), completedDate?
estimatedHours?, actualHours?
recurrence (JSON): { frequency, interval, dayOfWeek?, dayOfMonth?, endDate?, count? }
position (para orden en kanban), commentCount
attachments (Attachment[]), comments (Comment[]), subtasks (Task[] legacy/pausado)
```

**Enums:**
- `TaskStatus`: `backlog | todo | in_progress | in_review | done | blocked | archived`
- `TaskPriority`: `low | medium | high | urgent`
- `TaskType`: `feature | bug | improvement | task | documentation`

## Tipos TS

`src/types/` re-exportados desde `src/types/index.ts`:
- `domain/task` — Task, TaskStatus, TaskPriority, TaskType
- `dto/task.dto` — CreateTaskDTO, UpdateTaskDTO, MoveTaskDTO, ReorderKanbanDTO
- `ui/kanban.ui` — KanbanDragState, KanbanUIFilters
- `ui/forms.ui` — TaskFormValues

## Tareas con hora

`dueDate` es `DateTime` en Prisma (incluye hora). UI tiene inputs `date` + `time` separados:
```ts
new Date(`${date}T${time}`)
```
Hora se muestra en kanban card y detail modal **solo si ≠ medianoche local**. En agenda, hora ≠ 00:00 → sección "Hoy con hora".

## Recurrencia

`TaskService.moveTask()` crea automáticamente la siguiente ocurrencia cuando una tarea con `recurrence` pasa a `done` **por primera vez** (si ya estaba en `done`, no vuelve a crear — evita duplicados al reabrir/re-finalizar). La nueva ocurrencia copia el checklist con ítems en `done: false`. **No crear ocurrencias manualmente.**

Para cambios de status, **siempre usar `useMoveTask`** (no `useUpdateTask`) — garantiza que `moveTask()` se ejecute en backend. Ver decisions/002.

## Sprint Tabs en Kanban (`/dashboard/tareas`)

Store: `useScrumUIStore` (`src/stores/scrum-ui.store.ts`) — `selectedSprintId` + `viewMode: 'board' | 'backlog'`.

**Tabs:**
- **Todas** — `viewMode: 'board'`, `selectedSprintId: null`
- **Backlog** — `viewMode: 'backlog'` → filter `status: ['backlog']`
- **[Nombre ciclo activo]** — tab dinámico, punto verde, solo si `status: 'active'`
- **Otros ▾** — dropdown con planning/completed/closed

**Filtros server-side:** `TaskFilters` acepta `status?: TaskStatus[]`, `cycleId?: string[]`, `noCycle?: boolean`, `assigneeId?: string[]`, `dueDateFrom?: Date` y `dueDateTo?: Date`. Fluyen: `tasksApi` → `GET /api/tasks` → `taskRepository.buildWhere()`.

**Regla:** NO crear estado local para filtro de sprint — `useScrumUIStore` es la fuente de verdad compartida entre `page.tsx` y `CreateTaskModal`.

**CreateTaskModal:** si tab activo es sprint (`viewMode: 'board'` + `selectedSprintId`), "Período/Sprint" se pre-selecciona automáticamente. Field aparece solo si el negocio tiene ≥ 1 ciclo.

`CreateTaskDTO` incluye `cycleId?: string` — el repositorio lo pasa a Prisma por spread (`...rest`).

## Criterio de pendientes

Helper compartido: `src/lib/tasks/task-status.ts`.

- **Pendiente / activa:** status no está en `done`, `archived` ni `backlog`.
- **Accionable hasta hoy:** pendiente y sin fecha, vencida o con `dueDate` hasta el final del día actual.
- **Trabajo comprometido para burndown:** incluye completadas, pero excluye `backlog`, `archived` y tareas con vencimiento futuro.

Dashboard, agenda, reportes y burndown deben usar este helper para evitar que backlog o tareas futuras inflen los contadores de trabajo pendiente.

## Agenda Inteligente (`/dashboard/tareas/agenda`)

Componente: `src/components/tareas/agenda-view.tsx`.

**Secciones (orden de urgencia):**
1. ⚡ **Foco del día** — top 3 por score (no muestra si 0 activas)
2. 🔴 **Vencidas** — `dueDate < hoy`, status ≠ done, label "Xh atrás"
3. 🕐 **Hoy con hora** — `dueDate = hoy` con hora ≠ 00:00, orden cronológico
4. 🎯 **Para hoy** — `dueDate = hoy` todo-día, orden por score
5. 📅 **Esta semana** — próximos 7 días, orden por fecha
6. ⏱ **Próximamente** — próximos 30 días, visible con toggle "Todas"
7. 📥 **Sin fecha** — sin `dueDate`, colapsable, orden por score
8. ✅ **Completadas** — colapsadas por defecto, últimas 30

**Scoring:** `PRIORITY_SCORE + STATUS_SCORE + 300 (asignado a mí) + 50 (creador) + min(horasAtraso×10, 500)`

**Quick actions:** click en círculo → dropdown de status (usa `useMoveTask`).

**`now` reactivo:** se actualiza cada 60s y en `window.focus`.

**Toggle "Hasta hoy / Todas":** por defecto la agenda muestra el trabajo accionable hasta hoy. Las tareas futuras quedan ocultas del conteo principal y se muestran intencionalmente con "Todas".

## Filtros de Agenda y Calendario

Componente compartido: `src/components/tareas/task-filter-bar.tsx` (`TaskFilterBar`), renderizado por las pages `tareas/agenda/page.tsx` y `tareas/calendario/page.tsx`.

**Filtros:** persona asignada (multi-select), objetivo, prioridad, local/sector, y en Calendario un toggle "Ocultar finalizadas".

**Estado:** `useTaskFiltersUIStore` (`src/stores/task-filters-ui.store.ts`) — slices independientes por vista (`agenda` / `calendar`) con la misma forma `TaskFilterState` (`src/types/ui/task-filters.ui.ts`). Defaults: agenda sin filtros; calendario con `excludeStatuses: ['done']` (oculta finalizadas por defecto). `clearFilters(view)` restaura el default de cada vista.

**Filtrado client-side:** la page filtra la lista ya fetcheada con el predicado puro `matchesTaskFilters(task, filters)` (semántica AND) y pasa la lista filtrada a `AgendaView` / `CalendarView` — las vistas no conocen los filtros. Se mantiene la query sin filtros (`useTasksQuery()`) para preservar el cache compartido de React Query, los conteos de secciones de la agenda y el drag-drop del calendario.

**Decisión:** el Calendario NO lleva el toggle "Hasta hoy / Todas" — la navegación por fechas es propia de FullCalendar.

**Gap conocido (pre-existente):** `taskRepository.findByCreator` solo aplica `status`, `priority`, `cycleId`, `noCycle` y `search` — no afecta a estos filtros porque son client-side, pero importa si algún día se pasa a filtrado server-side en el path sin `businessId`.

## Ciclos y Objetivos

### Cycle (Sprints)
```
id, name, goal?, businessId
status (CycleStatus): planning | active | completed | closed
startDate?, endDate?
tasks (Task[])
```
Gestionados en `/dashboard/planificacion`. Tareas asociadas via `cycleId`.

### Objective (Épicas/OKRs)
```
id, name, description?, businessId
status (ObjectiveStatus): active | completed | archived
progress (0-100), dueDate?
tasks (Task[])
```
Gestionados en `/dashboard/planificacion/objetivos`.

**Asignación de tareas:** `POST /api/cycles/[id]/tasks` o `POST /api/objectives/[id]/tasks`.
Body: `{ taskIds: string[], action?: 'assign' | 'remove' }`.
El endpoint valida cross-tenant antes de asignar — ver decisions/003.

## Creación por chat / voz (Planificador)

UI principal: panel **Asistente IA → tab Planificador** (`src/components/layout/ai-assistant-panel.tsx`).
Modal legacy de dictado: `dictate-tasks-modal.tsx` (misma preview compartida).

### Flujo Planificador (lenguaje natural)

1. Usuario describe tareas en español (texto o 🎤).
2. `POST /api/assistant/planner` → `runPlannerAgent` (intent + pipeline).
3. Respuesta estructurada:
   - `clarify` — pregunta + chips opcionales (assignee, fecha, sprint, etc.)
   - `preview_tasks` — tarjetas editables (`TaskPreviewCard`)
   - `preview_plan` — planificación de sprint/objetivo antes de confirmar
   - `message` — texto informativo
4. Usuario confirma → `useConfirmDictatedTasks` → `POST /api/tasks`.
5. **Editar en formulario** — prellena `CreateTaskModal` vía `openCreateModalWithDraft` (`CreateTaskDraft` en `kanban-ui.store`).

### Extracción directa (fast-path)

- `POST /api/tasks/from-text` — texto → `extractTasksFromTranscription`
- `POST /api/tasks/from-audio` — Whisper → extracción

Contexto inyectado server-side (`loadExtractContext`): miembros, sedes, tableros, ciclos, objetivos, defaults (tablero Principal, sprint activo), etiqueta de espacio (`siteLabel`).

### Campos soportados en extracción / confirmación

Título, descripción, status, prioridad, tipo, tags, fecha+hora, assignees, location, project / **projectIds** (varios tableros), cycle, objective, checklist, recurrencia (`weekly`, `biweekly`, `monthly`, etc.).

**Subtareas:** el concepto queda pausado para evitar confusión con checklist. La UI no muestra ni crea subtareas; si una extracción legacy devuelve `subtasks`, se transforman en items de checklist. Las rutas `/api/tasks/[id]/subtasks` y `parentId` quedan como soporte técnico dormido para retomar más adelante.

Defaults al confirmar: si falta tablero → tablero Principal; si falta `cycleId` → sprint seleccionado en UI (`useTaskPreviewContext.confirmOptions`).

### Copia en varios tableros (tareas independientes)

No hay tarea compartida entre tableros: cada tablero recibe su **propia fila** `Task` (mismo contenido, distinto `projectId`). Al completar o editar una copia, las demás no cambian.

| Entrada | Comportamiento |
|---------|----------------|
| Planificador / voz / texto | El LLM puede devolver `projectIds: ["id1","id2"]` si el usuario nombra varios tableros; en preview, `ProjectMultiPicker` permite ajustar la selección antes de confirmar. |
| Confirmar preview | `useConfirmDictatedTasks` expande cada ítem a N `POST /api/tasks` (uno por tablero). |
| Modal «Nueva tarea» | Multi-select de tableros; si hay más de uno → `POST /api/tasks/replicate` con plantilla. |
| Detalle de tarea | «Duplicar en tableros» → `POST /api/tasks/replicate` con `sourceTaskId` (copia checklist reseteado, estado `todo`). |

API: `POST /api/tasks/replicate` — body `{ projectIds: string[], template?: CreateTaskDTO, sourceTaskId?: string }`. Valida que todos los `projectIds` pertenezcan al `businessId` del usuario.

Helpers: `src/lib/tasks/resolve-project-targets.ts`, `src/lib/tasks/task-to-create-dto.ts`.

## Aislamiento por espacio

`Task.businessId` es la fuente principal del tenant. Ver ADR [`docs/decisions/007-task-business-id-isolation.md`](decisions/007-task-business-id-isolation.md).

Para filas legacy con `businessId = null`, el backend solo infiere pertenencia por `project.businessId` o `location.businessId`; nunca por `creator.businessId`. Ejecutar `npx tsx --env-file=.env.local scripts/backfill-task-business-id.ts --execute` para completar filas inferibles por tablero/sector.

**No incluye:** sincronizar copias entre tableros, copiar adjuntos/comentarios, ni un solo Kanban card visible en múltiples tableros sin duplicar.

### Componentes clave

| Archivo | Rol |
|---------|-----|
| `src/lib/groq/extract-tasks.ts` | Schema `ExtractedTask` + prompt LLM |
| `src/lib/groq/planner-intent.ts` | Clasificación de intención |
| `src/lib/groq/planner-tools.ts` | Pipeline intent → clarify / preview |
| `src/components/tareas/task-preview-card.tsx` | Preview editable unificada |
| `src/hooks/mutations/use-dictate-tasks.ts` | Confirmación → DTO completo (fan-out multi-tablero) |
| `src/components/tareas/project-multi-picker.tsx` | Selector multi-tablero |
| `src/app/api/tasks/replicate/route.ts` | Duplicar plantilla o tarea existente en N tableros |
| `src/hooks/mutations/use-replicate-task.ts` | Mutación cliente para replicate |
