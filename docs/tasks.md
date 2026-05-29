# Tasks, Kanban, Agenda, Sprint Tabs

## Modelo Task — campos completos

```
id, title, description
status (TaskStatus), priority (TaskPriority), type (TaskType)
creatorId, projectId?, locationId?, parentId?   ← subtareas via parentId
cycleId?, objectiveId?                          ← asociación a sprint/objetivo
assignees (User[]), tags (String[])
startDate?, dueDate? (DateTime — incluye hora), completedDate?
estimatedHours?, actualHours?
recurrence (JSON): { frequency, interval, dayOfWeek?, dayOfMonth?, endDate?, count? }
position (para orden en kanban), commentCount
attachments (Attachment[]), comments (Comment[]), subtasks (Task[])
```

**Enums:**
- `TaskStatus`: `backlog | todo | in_progress | in_review | done | blocked`
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
- **Backlog** — `viewMode: 'backlog'` → filter `noCycle: true`
- **[Nombre ciclo activo]** — tab dinámico, punto verde, solo si `status: 'active'`
- **Otros ▾** — dropdown con planning/completed/closed

**Filtros server-side:** `TaskFilters` acepta `cycleId?: string[]` y `noCycle?: boolean`. Fluyen: `tasksApi` → `GET /api/tasks` → `taskRepository.buildWhere()`.

**Regla:** NO crear estado local para filtro de sprint — `useScrumUIStore` es la fuente de verdad compartida entre `page.tsx` y `CreateTaskModal`.

**CreateTaskModal:** si tab activo es sprint (`viewMode: 'board'` + `selectedSprintId`), "Período/Sprint" se pre-selecciona automáticamente. Field aparece solo si el negocio tiene ≥ 1 ciclo.

`CreateTaskDTO` incluye `cycleId?: string` — el repositorio lo pasa a Prisma por spread (`...rest`).

## Agenda Inteligente (`/dashboard/tareas/agenda`)

Componente: `src/components/tareas/agenda-view.tsx`.

**Secciones (orden de urgencia):**
1. ⚡ **Foco del día** — top 3 por score (no muestra si 0 activas)
2. 🔴 **Vencidas** — `dueDate < hoy`, status ≠ done, label "Xh atrás"
3. 🕐 **Hoy con hora** — `dueDate = hoy` con hora ≠ 00:00, orden cronológico
4. 🎯 **Para hoy** — `dueDate = hoy` todo-día, orden por score
5. 📅 **Esta semana** — próximos 7 días, orden por fecha
6. ⏱ **Próximamente** — próximos 30 días, colapsable
7. 📥 **Sin fecha** — sin `dueDate`, colapsable, orden por score
8. ✅ **Completadas** — colapsadas por defecto, últimas 30

**Scoring:** `PRIORITY_SCORE + STATUS_SCORE + 300 (asignado a mí) + 50 (creador) + min(horasAtraso×10, 500)`

**Quick actions:** click en círculo → dropdown de status (usa `useMoveTask`).

**`now` reactivo:** se actualiza cada 60s y en `window.focus`.

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
