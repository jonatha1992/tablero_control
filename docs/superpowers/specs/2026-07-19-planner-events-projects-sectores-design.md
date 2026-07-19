# Design: Planificador eventos, proyectos, sectores tabla, header PWA

**Fecha:** 2026-07-19  
**Estado:** aprobado en conversación — pendiente review del archivo  
**Rama:** `dev`  
**Orden de implementación:** fases 1 → 6

## Objetivo

Seis mejoras UX/producto pedidas en la misma sesión:

1. Crear **eventos** desde el Planificador (chat IA), no solo tareas.
2. Al “quitar” un **proyecto/tablero**: archivar (default) o eliminar con cascade.
3. Campo de estimación **⏱** más claro (`h` + `min`, opcional).
4. Vista **Sectores** en tabla con conteos de tareas (eventos a nivel espacio).
5. Header: reemplazar botón Ayuda por **Instalar** (Ayuda queda en sidebar).
6. Permitir finalizar tarea con **checklist incompleto** vía confirmación (no bloqueo duro).

## Contexto actual

- Planificador: `classifyPlannerIntent` + `runIntentPipeline` → solo `create_task` / plan / objective. Preview: `TaskPreviewCard`. Confirm: `POST /api/tasks`.
- Eventos: entidad `CalendarEvent` (`reminders: ReminderConfig[]` con `notification` | `email`). CRUD y UI en `/dashboard/eventos` y calendario. **No** hay extracción por chat ni cron de avisos de eventos.
- Avisos de tareas: cron `GET /api/cron/task-reminders` → `sendNotification` (BD + FCM). **No** envía mail hoy.
- Proyectos: `ProjectStatus` incluye `archived`. `projectService.delete` hace hard-delete; Prisma `Task.projectId` tiene `onDelete: Cascade`. No hay dialog Archivar vs Eliminar.
- Sectores: `SectorList` en grid de cards; solo muestra miembros, no conteos de tareas.
- Header: botón outline “Instalar app” si `canInstall` + ícono Ayuda. Ayuda también en sidebar.
- Finalizar tarea: `validateTaskCompletion` bloquea con toast si hay ítems de checklist pendientes (también exige adjunto si el espacio lo configura).

---

## Fase 1 — Eventos en el Planificador

### Comportamiento

- Usuario describe algo tipo examen / reunión / cita / “evento” / “avisame”.
- Intent nuevo: `create_event` (y batch implícito si hay varios).
- Si el clasificador duda entre tarea y evento → `clarify` con chips **Evento** | **Tarea**.
- Si claro → `preview_events` con tarjetas editables (`EventPreviewCard`).
- Confirmar → `useCreateCalendarEvent` / `POST /api/calendar-events` (API existente).
- Badge visible “Evento” en preview y en notificaciones.

### Clasificación (mixto)

- Automático cuando hay señales fuertes (examen, reunión, cita, “como evento”, “no es tarea”).
- Si ambiguo o confidence baja → pregunta (mejor onboarding para quien no conoce el sistema).

### Datos extraídos

| Campo | Obligatorio | Notas |
|-------|-------------|--------|
| title | sí | |
| start | sí | fecha (+ hora si no all-day) |
| end | no | default: start + 1h, o fin de día si allDay |
| allDay | no | default false; true si no hay hora |
| description | no | |
| assigneeIds | no | default: usuario actual |
| color | no | default sistema |
| reminders | sí (default) | ver abajo |

### Avisos (mail + notificación)

Default al crear desde Planificador:

```ts
reminders: [
  { type: 'notification', minutesBefore: 0 }, // alineado a “día del evento” vía cron
  { type: 'email', minutesBefore: 0 },
]
```

**Canales:** ambos (decisión A del usuario).

**Timing:** mismo patrón que tareas con vencimiento (cron diario: mañana / hoy / recién pasado), aplicado a `CalendarEvent.start` del día. Títulos:

- `📅 Evento mañana`
- `📅 Evento hoy`
- `📅 Evento pasó` (o equivalente claro)

Implementación:

- Nuevo cron `GET /api/cron/event-reminders` (o extensión del existente con sección eventos) protegido con `CRON_SECRET`.
- Por cada reminder `notification` → `sendNotification` (BD + FCM), `link: /dashboard/eventos` (o calendario).
- Por cada reminder `email` → nuevo método en `mail.service` (plantilla simple “Evento: {title} — {fecha}”) + email del assignee/creator.
- Destinatarios: `assigneeIds` si hay; si vacío → `creatorId`.
- Sin mail en el flujo de creación de **tareas** en este cambio (solo eventos), salvo que el cron de tareas se toque por accidente — no ampliar scope.

### UI Planificador

- Extender `PlannerResponse` con `preview_events`.
- `EventPreviewCard`: título, fecha, hora, all-day, participantes; sin prioridad/tablero/checklist.
- Botón confirmar: “Crear N evento(s)”.
- Mensajes mixtos en un turn: si el usuario pide tarea + evento, preferir clarify o dos previews en secuencia (v1: un intent dominante; batch mixto queda fuera de v1 si complica).

### Archivos clave (orientativos)

- `src/lib/groq/planner-intent.ts`, `planner-tools.ts`, `planner-types.ts`, `planner-agent.ts`
- `src/hooks/mutations/use-assistant-chat.ts`, `src/components/layout/ai-assistant-panel.tsx`
- Nuevo: extract events helper (o ampliar extract con kind)
- `src/app/api/cron/event-reminders/route.ts` + mail template
- Docs: `docs/tasks.md`, `docs/integrations.md`, `docs/api-routes.md`

### Tests

- Intent: examen → `create_event`; “hacer informe” → `create_task`; ambiguo → clarify.
- Pipeline → `preview_events`.
- Cron: envía notification + email stubs.

---

## Fase 2 — Archivar / eliminar proyecto (tablero **y** sede/materia)

### Contexto importante

En la UI del usuario, “proyecto/materia” suele ser un **`Location`** (página Sectores, tipo `proyecto` / `materia`), no solo un `Project` (tablero Kanban).

Hoy `Task.location` **no** tiene `onDelete: Cascade`: al borrar una sede las tareas quedan huérfanas y siguen en agenda. `Task.projectId` sí cascadea.

Esta fase cubre **ambos**:

| Entidad | Archivar | Eliminar |
|---------|----------|----------|
| `Project` (tablero) | `status = archived` | hard-delete (cascade tareas) |
| `Location` (sede/materia/proyecto) | `status = closed` o `inactive` (tratar como archivado en vistas) | hard-delete **después** de borrar o soft-hide tareas asociadas (cascade lógico en service) |

### Comportamiento UI

Al eliminar/quitar desde UI (picker de tableros y dialog de Sectores):

1. Dialog con dos acciones:
   - **Archivar** (recomendada / default): marca entidad archivada. Fuera de selectores activos. Tareas asociadas **no** aparecen en agenda/kanban de trabajo activo.
   - **Eliminar permanente**: hard-delete. Confirmación fuerte: mostrar conteo de tareas + checkbox o texto “Eliminar”.

2. Invalidar queries de proyectos/locations **y** tareas tras ambas acciones.

### Filtrado post-archivo

- Vistas activas: excluir tareas cuyo `project.status === 'archived'` **o** cuya `location.status` ∈ `{ closed, inactive }` (definir helper único).
- Selectores: no listar entidades archivadas por default.

### Docs

- `docs/tasks.md`, `docs/models.md`

### Tests

- Archive project / location.
- Delete location elimina o desvincula tareas (no dejan zombis en agenda).
- Filtro: tarea de entidad archivada no es pendiente en vistas activas.

---

## Fase 3 — Campo ⏱ estimación

### Comportamiento

- En `TaskPreviewCard` (y alinear `CreateTaskModal` si el control actual es el mismo patrón decimal):
  - Inputs opcionales: **horas** (int ≥ 0) + **minutos** (0–59).
  - Ambos vacíos → `estimatedHours = undefined`.
  - Persistencia interna sigue siendo `estimatedHours: number` (decimal, ej. 1.5).
- Display: `1h 30m`, nunca `1.5h` como único formato en preview/lista del asistente.

### Fuera de scope

- Cambiar el modelo Prisma o time-tracking (`actualHours`).

### Tests

- Helpers convert h+min ↔ decimal; vacío → undefined.

---

## Fase 4 — Sectores en tabla

### Comportamiento

Reemplazar grid de cards en `SectorList` / `SectoresPage` por **tabla**:

| Nombre | Tipo | Estado | Miembros | Tareas | Finalizadas | Acciones |
|--------|------|--------|----------|--------|-------------|----------|

- **Tareas:** count por `locationId`.
- **Finalizadas:** status ∈ `{ done, archived }` (decisión B).
- Click fila → detalle (igual que card).
- Acciones ⋮: Editar / Eliminar.
- Empty state y loading (skeleton filas) equivalentes.
- **Eventos:** no se muestran por sede; permanecen a nivel espacio (`/dashboard/eventos`, calendario).

### Datos

- Preferir una query agregada o conteos en el listado de locations (evitar N+1 pesado). Opción: `useTasksQuery` filtrado client-side por location si el set es chico; si no, endpoint con `_count` por location.

### Docs

- `docs/frontend.md` (o sección equipo/sedes si existe).

---

## Fase 5 — Header: Instalar reemplaza Ayuda

### Comportamiento

- Quitar el `Link` a `/dashboard/ayuda` del header.
- Quitar el botón outline “Instalar app” duplicado.
- En el slot del ícono (ghost `size="icon"`): botón **Instalar** con ícono `Download`, visible solo si `canInstall`; `onClick={install}`; `title="Instalar aplicación"`.
- Ayuda sigue accesible desde el **sidebar**.

### Docs

- `docs/frontend.md` (layout header).

---

## Fase 6 — Finalizar con checklist incompleto (confirmación)

### Problema

Hoy `validateTaskCompletion` impide pasar a `done` si hay ítems de checklist sin marcar (toast). El usuario quiere poder finalizar igual (p. ej. “ya está procesado / hecho”) pero con una pregunta explícita.

### Comportamiento

1. Al intentar `done` (Kanban drag, Agenda, detalle) con checklist incompleto → **dialog de confirmación** (no toast bloqueante).
2. Copia: “Hay N pasos sin marcar. ¿Pasamos a finalizado igual?”
3. Mostrar lista de ítems: hechos vs pendientes (check / pendiente).
4. **Sí / Confirmar** → ejecutar el move a `done` (misma lógica de recurrencia que hoy).
5. **No / Cancelar** → no cambia el status.
6. **Adjunto requerido** (setting del espacio): sigue siendo **bloqueo duro** con toast/mensaje; no hay bypass en esta fase.

### Implementación orientativa

- Refactor `validateTaskCompletion` → devolver resultado estructurado (`ok` | `needsChecklistConfirm` | `blockedAttachment`) en lugar de solo boolean + toast.
- Un `ConfirmDialog` compartido (o modal específico) usado desde `kanban-board`, `agenda-view`, `task-detail-modal`.
- Flag interno tipo `forceComplete` / `skipChecklistCheck` solo tras confirmación UI (no exponer bypass silencioso en API salvo que el server ya no valide checklist — verificar backend; si el server no valida, basta UI).

### Docs

- `docs/tasks.md`, ayuda (`docs/frontend.md` / página ayuda si menciona el bloqueo).

### Tests

- Completo → done sin dialog.
- Incompleto → dialog; cancel no mueve; confirm mueve.
- Adjunto requerido + sin adjunto → sigue bloqueado.

---

## Orden y criterios de done

| Fase | Done cuando |
|------|-------------|
| 1 | Chat crea evento con preview; cron avisa mail+push con label Evento; tests intent/pipeline |
| 2 | Dialog archivar/eliminar; archivados ocultos en vistas activas; cache ok |
| 3 | Preview/modal h+min; display legible |
| 4 | Tabla sectores con conteos correctos |
| 5 | Header sin Ayuda; Instalar en su lugar |
| 6 | Dialog checklist incompleto; adjunto sigue bloqueando; tests |

Después de cada fase: actualizar docs de dominio + `npm run check` (o el subset relevante) antes de seguir.

## Fuera de scope (explícito)

- Eventos por sede/materia.
- Estimación en segundos.
- Cambiar modelo User multi-location.
- Reescribir el asistente informativo (modo `assistant`), solo Planificador.
- Forzar mail en avisos de **tareas** (solo eventos en esta entrega).
- Bypass de la regla de adjunto obligatorio al finalizar.

## Riesgos

- Cron de eventos + mail: rate limits / plantillas; stubbear en tests.
- Filtrar proyectos archivados en muchas vistas: centralizar helper (`isActiveProject` / `taskVisibleInActiveViews`) para no olvidar una.
- Cache React Query tras delete: invalidar `taskKeys` + `projectKeys`.
- Confirmación checklist: tres entry-points (kanban / agenda / detalle) deben usar el mismo helper para no divergir.
