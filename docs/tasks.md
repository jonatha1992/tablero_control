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

## Checklist en detalle de tarea

`TaskChecklist` actualiza vía `useUpdateTask` (`PATCH` con `checklist`). El modal (`TaskDetailModal`) **no** usa el snapshot stale de Agenda/Calendario: resuelve la tarea viva desde `useTasksQuery()` para que toggle/agregar/borrar se vean al instante tras el update optimista.

Helper compartido: `src/lib/task-validation.ts`.

- `checkTaskCompletion(task, settings)` devuelve un resultado tipado (`ok`, `checklist_incomplete`, `attachment_required`) para reutilizar la misma regla en UI y tests.
- Si el negocio tiene `settings.requireAttachmentToFinalize = true` y la tarea no tiene adjuntos, el cierre queda **bloqueado** con toast. No hay bypass desde la UI.
- Si faltan items de checklist, Kanban, Agenda y `TaskDetailModal` abren `IncompleteChecklistDialog` con los pendientes y permiten **confirmar igualmente** el paso a `done`.
- En **bulk move a done** (toolbar o drag multi-selección), Kanban valida **todas** las tareas seleccionadas: si alguna requiere adjunto o tiene checklist incompleto, aborta el movimiento completo con toast; para checklist, el usuario debe resolverlas una por una o deseleccionarlas.
- El checklist no se auto-completa al confirmar: la tarea se cierra con los items pendientes visibles en el historial/detalle.

## Sprint Tabs en Kanban (`/dashboard/tareas`)

Store: `useScrumUIStore` (`src/stores/scrum-ui.store.ts`) — `selectedSprintId` + `viewMode: 'board' | 'backlog'`.

Cada columna tiene su propio botón **Ordenar** en el encabezado y recuerda independientemente el criterio elegido:

- **Por prioridad:** `urgent`, `high`, `medium`, `low`; dentro de cada prioridad muestra primero las tareas más antiguas.
- **Por fecha:** usa `createdAt` ascendente, desde la tarea más antigua hasta la más nueva.

En prioridad, `createdAt` ascendente desempata tareas con la misma prioridad.

**Tabs:**
- **Todas** — `viewMode: 'board'`, `selectedSprintId: null`. Columnas default: Backlog, Por hacer, En progreso, Hecho.
- **Backlog** — `viewMode: 'backlog'` → filter `status: ['backlog']` y **solo** la columna Backlog (aunque esté oculta en Configurar Tablero). No es “tareas sin período”.
- **[Nombre ciclo activo]** — tab dinámico, punto verde, solo si `status: 'active'`
- **Otros ▾** — dropdown con planning/completed/closed

**Kanban inteligente** (`src/lib/tasks/kanban-intelligence.ts`):
- `+` de una columna abre el modal con ese `status`.
- Tab Backlog o columna Backlog → `status: backlog` y **sin** `dueDate`.
- Período activo + columna que no es backlog → prellena `cycleId`.
- Filtros de objetivo/sede del kanban se copian al draft.
- Si el Kanban está en un proyecto (`?projectId=`), el draft lleva ese `projectId`.
- Cards muestran nombre del objetivo (y sede) si están vinculados.

**Proyectos:** Tareas → Proyectos lista todos los `Project`. Entrar filtra el Kanban y las solapas de período de ese proyecto. “Ver todo” quita el filtro.

**Filtros server-side:** `TaskFilters` acepta `status?: TaskStatus[]`, `cycleId?: string[]`, `noCycle?: boolean`, `assigneeId?: string[]`, `dueDateFrom?: Date` y `dueDateTo?: Date`. Fluyen: `tasksApi` → `GET /api/tasks` → `taskRepository.buildWhere()`.

**Regla:** NO crear estado local para filtro de sprint — `useScrumUIStore` es la fuente de verdad compartida entre `page.tsx` y `CreateTaskModal`.

**CreateTaskModal:** draft del store + contexto scrum. Campo **Objetivo** (si hay activos) y **Período** (si hay ciclos). El detalle de tarea (`TaskDetailModal`) también edita Objetivo y Período.

**Backlog ≠ Objetivo:** backlog es un *estado* de tarea (cola). Objetivo es una *entidad* que agrupa tareas y se completa. Una tarea puede estar en backlog *y* ligada a un objetivo.

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

**Filtro de entidades activas:** `src/lib/tasks/active-entity.ts` centraliza la regla para ocultar tareas ligadas a entidades archivadas. Si `project.status === 'archived'` o `location.status` está en `closed | inactive`, la tarea se excluye de Agenda, Calendario y la vista principal de `/dashboard/tareas`.

**Archivar vs eliminar entidades:**
- Archivar **Sector/Location** = `status: 'closed'` y sus tareas dejan de aparecer en vistas activas por el filtro de entidades.
- Archivar **Tablero/Project** = `status: 'archived'`.
- Eliminar **Sector/Location** hace hard delete del sector **y primero borra en transacción** todas las tareas con ese `locationId` para evitar huérfanas.
- Mutaciones cliente de sectores/tableros invalidan cache de la entidad y `taskKeys.all` para refrescar agenda, calendario y tablero principal.
- Gestión de tableros: `/dashboard/tareas/tableros`, con pestañas Activos/Archivados. Visible en el menú solo si hay más de un tablero activo o alguno archivado; si no, la ruta redirige al Kanban. Archivar advierte pendientes pero permite continuar; no puede archivarse el último activo. Restaurar vuelve a `active` si el plan tiene cupo. Archivados no consumen límite.
- `useActiveTasksQuery()` aplica la regla de entidades activas también en Cronograma, Dashboard, métricas y Reportes.

## CalendarEvents en Vistas de Calendario y Agenda

`CalendarEvent` es una entidad separada de `Task` — representa eventos de calendario (reuniones, bloqueos de tiempo) sin lógica de tareas ni recurrencia automática.

**Tipo TS:** `src/types/domain/calendar.ts` → `CalendarEvent` (campos: `id, title, description?, start, end, allDay, color?, assigneeIds?`).

### Vista Calendario FullCalendar (`/dashboard/tareas/calendario`)

`CalendarView` acepta `calendarEvents?: CalendarEvent[]` además de `tasks`. Los eventos se renderizan visualmente distintos:
- Fondo semi-transparente (`color + '33'`), borde sólido del color del evento, texto del mismo color
- Clase CSS `fc-event-calendar`: cursiva, borde 2px sólido
- Las tareas siguen con fondo sólido por prioridad, sin cambios

La página fetcha eventos con ventana de 1 mes atrás → 2 meses adelante (`useCalendarEventsQuery(eventsFrom, eventsTo)`).

**Interacción:**
- Hover → `CalendarEventTooltip` (título, fecha, rango horario, descripción)
- Click → abre `CalendarEventSheet` (modal de edición completo)
- Click en fecha vacía → abre `CreateTaskModal` con fecha pre-seleccionada (`onDateClick`)
- Drag/drop solo aplica a tareas — los CalendarEvents tienen `editable: false`

**`CalendarEventSheet`** (`src/components/calendario/calendar-event-sheet.tsx`): modal Dialog (no Sheet — ese componente no existe en este proyecto) con formulario de edición: título, descripción, todo-el-día, inicio/fin, participantes, color. Usa `useUpdateCalendarEvent` y `useDeleteCalendarEvent` con confirmación antes de eliminar. El inner `EditForm` se monta con `key={event.id}` para resetear estado al cambiar de evento.

**Hooks de mutación:**
- `src/hooks/mutations/use-update-calendar-event.ts`
- `src/hooks/mutations/use-delete-calendar-event.ts`

### Lista Eventos (`/dashboard/eventos`)

Ítem **top-level** del sidebar (mismo nivel que Tareas), no vive bajo Planificación. Página dedicada: lista agrupada en **Próximos** / **Pasados**. Fetch sin ventana de fechas (`useCalendarEventsQuery()`).

**Interacción:**
- Click en fila → abre `CalendarEventSheet` (mismo modal de edición que Calendario)
- Botón trash en hover → `useDeleteCalendarEvent` (sin confirmación extra)
- "Nuevo evento" → `CreateEventModal`

### Dashboard home (`/dashboard`)

Home: **`DashboardUpcomingEvents`** en la fila de KPIs — solo conteo de pendientes (`end >= now`) + hint del próximo. Click en la card → `/dashboard/eventos`. Sin lista de eventos en el dashboard.

### Vista Agenda (`/dashboard/tareas/agenda`)

La agenda muestra tareas y eventos en secciones separadas. Los eventos del próximo mes se cargan con `useCalendarEventsQuery(eventsFrom, eventsTo)` (ventana: hoy → hoy+30d).

**Secciones de eventos (debajo de tareas):**
- 📅 **Hoy** — eventos con start en el día actual
- 📅 **Esta semana** — eventos de los próximos 7 días
- 📅 **Próximos 30 días** — eventos más adelante

Los eventos muestran franja de color lateral, rango horario (o "Todo el día"), y descripción si existe. No tienen acciones — son solo lectura en la agenda.

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

Imagen en chat: el panel permite adjuntar una sola imagen (upload o paste). Si se envía **solo la imagen**, el asistente pregunta Eventos o Tareas (`clarify`); al elegir, reenvía la imagen con intención clara y Gemini `gemini-2.5-flash` la normaliza antes del planner. Si el mensaje ya pide eventos/tareas, no pregunta. La imagen no se persiste; viaja inline en `POST /api/assistant/planner` y se mergea como `[Contenido de la imagen]` antes de `runPlannerAgent`.

1. Usuario describe tareas en español (texto o 🎤).
2. `POST /api/assistant/planner` → `runPlannerAgent` (intent + pipeline).
3. Respuesta estructurada:
   - `clarify` — pregunta + chips opcionales (assignee, fecha, sprint, etc.)
   - `preview_tasks` — tarjetas editables (`TaskPreviewCard`)
   - `preview_events` — tarjetas editables (`EventPreviewCard`) para eventos detectados antes de confirmar calendario
   - `preview_plan` — planificación de sprint/objetivo antes de confirmar
   - `message` — texto informativo
4. Usuario confirma → `useConfirmDictatedTasks` → `POST /api/tasks`.
5. Si confirma `preview_events`, el panel crea `CalendarEvent` vía `useCreateCalendarEvent` / `POST /api/calendar-events`.
   Defaults al confirmar eventos:
   - si `assigneeIds` viene vacío → usa el usuario actual
   - si es todo el día y falta fin → usa fin de día
   - si tiene hora y falta fin → usa `start + 1h`
   - siempre agrega reminders inmediatos (`notification` + `email`, `minutesBefore: 0`)
6. **Editar en formulario** — prellena `CreateTaskModal` vía `openCreateModalWithDraft` (`CreateTaskDraft` en `kanban-ui.store`).

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

`ProjectMultiPicker` excluye tableros con `status: 'archived'` y sanea selecciones viejas para no mantener IDs ocultos en filtros, replicación o previews.

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
| `src/components/tareas/event-preview-card.tsx` | Preview editable de eventos antes de crear en calendario |
| `src/hooks/mutations/use-dictate-tasks.ts` | Confirmación → DTO completo (fan-out multi-tablero) |
| `src/hooks/mutations/use-create-calendar-event.ts` | Crear `CalendarEvent` con invalidación y reminders default |
| `src/components/tareas/project-multi-picker.tsx` | Selector multi-tablero |
| `src/app/api/tasks/replicate/route.ts` | Duplicar plantilla o tarea existente en N tableros |
| `src/hooks/mutations/use-replicate-task.ts` | Mutación cliente para replicate |
