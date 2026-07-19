# Planificador eventos + UX (6 fases) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar las 6 fases del spec `docs/superpowers/specs/2026-07-19-planner-events-projects-sectores-design.md`: eventos en Planificador (mail+push), archivar/eliminar Location+Project, estimación h+min, tabla Sectores, header Instalar, confirmar done con checklist incompleto.

**Architecture:** Extender el pipeline del Planificador (intent → extract → preview → confirm) para `CalendarEvent`. Cron de avisos paralelo a `task-reminders` con FCM + email. Helpers de “entidad activa” para filtrar tareas de locations/projects archivados. Validación de completion refactorizada a resultado estructurado + dialog compartido.

**Tech Stack:** Next.js 16 App Router, Prisma/PostgreSQL, Groq LLM, Vitest, React Query, Resend/Gmail (`MailService`), FCM (`sendNotification`).

## Global Constraints

- Trabajar solo en rama `dev`.
- Sin `any` en TypeScript; imports con `@/`.
- Tras CREATE/UPDATE/DELETE en API: `writeAuditLog()` donde ya exista el patrón.
- Notificaciones in-app/push: siempre `sendNotification` de `@/lib/notifications`.
- Emails: `MailService` + plantilla React Email.
- Docs de dominio al cerrar cada fase (`docs/tasks.md`, `docs/frontend.md`, `docs/api-routes.md`, `docs/integrations.md` según toque).
- Tests: `./node_modules/.bin/vitest run <archivo>`.
- Commits frecuentes por task; mensajes en inglés tipo `feat:` / `fix:` / `docs:`.
- No bypass de adjunto obligatorio al finalizar (fase 6).
- Eventos no se asocian a sede; viven a nivel espacio.

---

## File map (creación / modificación principal)

| Área | Archivos |
|------|----------|
| Extract eventos | Create `src/lib/groq/extract-events.ts`; Test `src/test/extract-events.test.ts` |
| Planner | Modify `planner-intent.ts`, `planner-types.ts`, `planner-tools.ts`, `planner-agent.ts` |
| Chat UI | Modify `use-assistant-chat.ts`, `ai-assistant-panel.tsx`; Create `event-preview-card.tsx` |
| Cron + mail | Create `src/app/api/cron/event-reminders/route.ts`, `event-reminder-email.tsx`; Modify `mail.service.ts` |
| Visibility | Create `src/lib/tasks/active-entity.ts`; wire filters in agenda/kanban/queries |
| Project/Location delete | Modify `project.service.ts`, `location.service.ts`, Sectores delete dialog, `useDeleteProject` invalidate tasks |
| Estimación | Create `src/lib/tasks/estimated-hours.ts`; Modify `task-preview-card.tsx`, `create-task-modal.tsx` |
| Sectores tabla | Modify `sector-list.tsx`, `sectores/page.tsx` |
| Header | Modify `header.tsx` |
| Checklist confirm | Modify `task-validation.ts`; Create confirm dialog hook/component; wire kanban/agenda/detail |

---

### Task 1: ExtractedEvent + extractor Groq

**Files:**
- Create: `src/lib/groq/extract-events.ts`
- Test: `src/test/extract-events.test.ts`

**Interfaces:**
- Produces:
```ts
export interface ExtractedEvent {
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endDate?: string;
  endTime?: string;
  allDay: boolean;
  assigneeIds: string[];
  color?: string;
  order: number;
}

export async function extractEventsFromText(
  text: string,
  ctx: ExtractContext,
): Promise<ExtractedEvent[]>;
```

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/groq/client', () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                events: [{
                  title: 'Examen final',
                  startDate: '2026-07-25',
                  startTime: null,
                  endDate: null,
                  endTime: null,
                  allDay: true,
                  assigneeIds: [],
                  order: 1,
                }],
              }),
            },
          }],
        }),
      },
    },
  },
}));

import { extractEventsFromText } from '@/lib/groq/extract-events';

describe('extractEventsFromText', () => {
  it('parsea un evento all-day', async () => {
    const events = await extractEventsFromText('Examen final el 25 de julio', {
      members: [],
      locations: [],
      projects: [],
      cycles: [],
      objectives: [],
      today: '2026-07-19',
      siteLabel: 'Sede',
    });
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Examen final');
    expect(events[0].allDay).toBe(true);
    expect(events[0].startDate).toBe('2026-07-25');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (module missing)**

Run: `./node_modules/.bin/vitest run src/test/extract-events.test.ts`

- [ ] **Step 3: Implement `extract-events.ts`**

Mirror `extract-tasks.ts`: system prompt in Spanish, JSON-only, map members by name→id, default `allDay: true` when no time, clamp title length. Export `extractEventsFromText`.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/groq/extract-events.ts src/test/extract-events.test.ts
git commit -m "feat: extract calendar events from natural language"
```

---

### Task 2: Planner intent `create_event` + pipeline `preview_events`

**Files:**
- Modify: `src/lib/groq/planner-intent.ts`
- Modify: `src/lib/groq/planner-types.ts`
- Modify: `src/lib/groq/planner-tools.ts`
- Modify: `src/lib/groq/planner-agent.ts`
- Modify: `src/test/planner-intent.test.ts`

**Interfaces:**
- Extends `PlannerIntentType` with `'create_event'`
- Extends `PlannerResponse` with `{ type: 'preview_events'; events: ExtractedEvent[]; parseError: boolean }`
- Consumes: `extractEventsFromText` from Task 1

- [ ] **Step 1: Extend failing/updated tests in `planner-intent.test.ts`**

```ts
vi.mock('@/lib/groq/extract-events', () => ({
  extractEventsFromText: vi.fn().mockResolvedValue([
    { title: 'Examen', startDate: '2026-07-25', allDay: true, assigneeIds: [], order: 1 },
  ]),
}));

it('devuelve preview_events para create_event', async () => {
  const intent: PlannerIntentResult = {
    intent: 'create_event',
    confidence: 0.9,
    extractionText: 'Examen final el viernes',
    missingSlots: [],
  };
  const result = await runIntentPipeline(intent, baseCtx);
  expect(result.type).toBe('preview_events');
});

it('clarify Evento|Tarea cuando intent unknown con pregunta de tipo', async () => {
  const intent: PlannerIntentResult = {
    intent: 'unknown',
    confidence: 0.4,
    missingSlots: ['kind'],
    clarificationQuestion: '¿Lo anoto como evento o como tarea?',
    suggestedOptions: ['Evento', 'Tarea'],
  };
  const result = await runIntentPipeline(intent, baseCtx);
  expect(result.type).toBe('clarify');
});
```

- [ ] **Step 2: Run tests — expect FAIL on new cases**

Run: `./node_modules/.bin/vitest run src/test/planner-intent.test.ts`

- [ ] **Step 3: Implement**

In `classifyPlannerIntent` prompt, add:
- `create_event` for examen/reunión/cita/“evento”/“avisame del …”
- If ambiguous between task and event → `missingSlots: ['kind']`, options `["Evento","Tarea"]`

In `runIntentPipeline`, branch `create_event` → `extractEventsFromText` → `preview_events` (empty → clarify).

Wire `planner-agent.ts` to forward `preview_events`.

- [ ] **Step 4: PASS + Commit**

```bash
git add src/lib/groq/planner-*.ts src/test/planner-intent.test.ts
git commit -m "feat: planner create_event intent and preview_events"
```

---

### Task 3: EventPreviewCard + chat confirm → create calendar events

**Files:**
- Create: `src/components/tareas/event-preview-card.tsx`
- Modify: `src/hooks/mutations/use-assistant-chat.ts`
- Modify: `src/components/layout/ai-assistant-panel.tsx`
- Modify: `src/hooks/mutations/use-create-calendar-event.ts` (reuse; ensure reminders default)

**Interfaces:**
- DisplayMessage adds:
```ts
export interface EventsMessage {
  role: 'events';
  events: ExtractedEvent[];
  parseError: boolean;
  confirmed: boolean;
}
```
- On confirm, map each event to `CreateCalendarEventDTO`:
```ts
{
  title,
  description,
  start: Date,
  end: Date, // start+1h or end of day if allDay
  allDay,
  assigneeIds: assigneeIds.length ? assigneeIds : [currentUserId],
  reminders: [
    { type: 'notification', minutesBefore: 0 },
    { type: 'email', minutesBefore: 0 },
  ],
}
```

- [ ] **Step 1: Implement `EventPreviewCard`** — editable title, date, time, allDay toggle, badge “Evento”. No priority/board.

- [ ] **Step 2: Wire `applyPlannerResponse` for `preview_events`**; render list + “Crear N evento(s)” calling `useCreateCalendarEvent` (or batch API calls). Invalidate `calendarEventKeys`. Toast success.

- [ ] **Step 3: Manual smoke** — Planificador: “Examen final el viernes” → preview → confirm → aparece en `/dashboard/eventos`.

- [ ] **Step 4: Update `docs/tasks.md` (sección Creación por chat)** + Commit

```bash
git add src/components/tareas/event-preview-card.tsx src/hooks/mutations/use-assistant-chat.ts src/components/layout/ai-assistant-panel.tsx docs/tasks.md
git commit -m "feat: confirm planner events into calendar"
```

---

### Task 4: Event reminder email + cron

**Files:**
- Create: `src/lib/mail/templates/event-reminder-email.tsx`
- Modify: `src/services/mail.service.ts` — add `sendEventReminderEmail`
- Create: `src/app/api/cron/event-reminders/route.ts`
- Test: `src/test/cron-event-reminders.test.ts` (mock prisma + mail + notifications)
- Modify: `docs/api-routes.md`, `docs/integrations.md`

**Interfaces:**
```ts
// MailService
static async sendEventReminderEmail(
  to: string,
  data: { eventTitle: string; whenLabel: string; eventsUrl: string },
): Promise<{ success: boolean; error?: string }>;
```

Cron logic (mirror `task-reminders`):
- Find events with `start` in tomorrow / today / yesterday day bounds.
- Recipients: `assigneeIds` if non-empty else `[creatorId]`.
- If reminders include `notification` (or reminders empty → treat as both for planner-created defaults): `sendNotification` with titles `📅 Evento mañana|hoy|pasó`, link `/dashboard/eventos`.
- If reminders include `email`: `MailService.sendEventReminderEmail`.
- Auth: `Authorization: Bearer ${CRON_SECRET}`.

- [ ] **Step 1: Write cron test with mocks** — asserts notification + email called for one event due today.

- [ ] **Step 2: Implement template + MailService + route**

- [ ] **Step 3: PASS tests + docs + Commit**

```bash
git add src/lib/mail/templates/event-reminder-email.tsx src/services/mail.service.ts src/app/api/cron/event-reminders/route.ts src/test/cron-event-reminders.test.ts docs/api-routes.md docs/integrations.md
git commit -m "feat: cron event reminders with push and email"
```

---

### Task 5: Active-entity helper + hide archived location/project tasks

**Files:**
- Create: `src/lib/tasks/active-entity.ts`
- Test: `src/test/active-entity.test.ts`
- Modify consumers that build “active” task lists (agenda page filters, kanban default if projects loaded, project selectors)

**Interfaces:**
```ts
export function isArchivedProjectStatus(status: string | undefined): boolean {
  return status === 'archived';
}
export function isArchivedLocationStatus(status: string | undefined): boolean {
  return status === 'closed' || status === 'inactive';
}
export function isTaskFromActiveEntities(
  task: { projectId?: string | null; locationId?: string | null },
  projectsById: Map<string, { status: string }>,
  locationsById: Map<string, { status: string }>,
): boolean;
```

Rule: if `projectId` set and project archived → false. If `locationId` set and location archived → false. Else true.

- [ ] **Step 1: Tests for helper**

- [ ] **Step 2: Implement helper; filter in Agenda (+ Calendario task list if needed). ProjectMultiPicker: exclude archived projects.**

- [ ] **Step 3: PASS + Commit**

```bash
git add src/lib/tasks/active-entity.ts src/test/active-entity.test.ts src/components/tareas/agenda-view.tsx src/components/tareas/project-multi-picker.tsx
git commit -m "feat: hide tasks from archived projects and locations"
```

---

### Task 6: Location + Project archive/delete dialogs

**Files:**
- Modify: `src/services/location.service.ts` — `archive(id)` sets `status: 'closed'`; `delete(id)` deletes tasks with that `locationId` then location (transaction).
- Modify: `src/services/project.service.ts` — `archive(id)` sets `status: 'archived'`; keep `delete`.
- Modify: `src/app/api/locations/[id]/route.ts` and `src/app/api/projects/[id]/route.ts` — support body `{ action: 'archive' }` on PATCH/DELETE semantics; audit log.
- Modify: `src/app/dashboard/equipo/sectores/page.tsx` — replace plain ConfirmDialog with choice Archivar | Eliminar (show task count).
- Modify: `src/hooks/queries/use-projects-query.ts` — on delete/archive invalidate `projectKeys` **and** task query keys.
- Modify: location delete mutation similarly.
- Test: extend `src/test/service-project.test.ts`; add/adjust location service tests.
- Docs: `docs/tasks.md`, `docs/models.md`

- [ ] **Step 1: Failing tests for `locationService.delete` removing tasks; `archive` sets closed**

- [ ] **Step 2: Implement services + API**

- [ ] **Step 3: Sectores UI dialog with two buttons; invalidate caches**

- [ ] **Step 4: Add archive/delete entry for tableros where projects are managed (if no UI yet: add menu on `ProjectMultiPicker` or small manage control on `/dashboard/tareas` when `showBoardPicker`). Minimum: API+service solid; UI at least for Locations (user’s bug).**

- [ ] **Step 5: PASS + Commit**

```bash
git commit -m "feat: archive or permanently delete locations and projects"
```

---

### Task 7: Estimated hours h + min UI

**Files:**
- Create: `src/lib/tasks/estimated-hours.ts`
- Test: `src/test/estimated-hours.test.ts`
- Modify: `src/components/tareas/task-preview-card.tsx`
- Modify: `src/components/tareas/create-task-modal.tsx` (same UX)
- Optional display: `ai-assistant-panel.tsx` confirmed line

**Interfaces:**
```ts
export function hoursToParts(estimatedHours?: number): { h: number; min: number } | null;
export function partsToHours(h: number, min: number): number | undefined;
// partsToHours(0,0) / both empty → undefined
// partsToHours(1, 30) → 1.5
export function formatEstimatedHours(estimatedHours?: number): string; // "1h 30m" | ""
```

- [ ] **Step 1: Unit tests for conversions**

- [ ] **Step 2: Replace decimal `<input type="number" step={0.25}>` with two small inputs (h, min); empty allowed**

- [ ] **Step 3: PASS + Commit**

```bash
git commit -m "feat: clearer estimated time inputs as hours and minutes"
```

---

### Task 8: Sectores table with task counts

**Files:**
- Modify: `src/components/sectores/sector-list.tsx` — table layout
- Modify: `src/app/dashboard/equipo/sectores/page.tsx` — pass tasks or counts
- Possibly: `useTasksQuery()` once; count client-side by `locationId`
- Docs: `docs/frontend.md`

Columns: Nombre | Tipo | Estado | Miembros | Tareas | Finalizadas | Acciones  
Finalizadas = `status === 'done' || status === 'archived'`.

- [ ] **Step 1: Implement table UI (semantic `<table>` + Tailwind; no new shadcn Table dep required)**

- [ ] **Step 2: Wire counts from `useTasksQuery()`**

- [ ] **Step 3: Visual check empty/loading; Commit**

```bash
git commit -m "feat: show sectors as table with task completion counts"
```

---

### Task 9: Header Install replaces Help

**Files:**
- Modify: `src/components/layout/header.tsx`
- Docs: `docs/frontend.md`

- [ ] **Step 1: Remove Help `Link`; remove outline “Instalar app” button**

- [ ] **Step 2: Icon ghost button with `Download`, `onClick={install}`, render only if `canInstall`**

- [ ] **Step 3: Confirm Ayuda still in sidebar; Commit**

```bash
git commit -m "feat: replace header help button with PWA install"
```

---

### Task 10: Checklist incomplete → confirm before done

**Files:**
- Modify: `src/lib/task-validation.ts`
- Create: `src/components/tareas/incomplete-checklist-dialog.tsx` (or hook `useCompleteTaskGuard`)
- Modify: `src/components/tareas/kanban-board.tsx`, `agenda-view.tsx`, `task-detail-modal.tsx`
- Test: `src/test/task-validation.test.ts`
- Docs: `docs/tasks.md`; update ayuda copy if it says checklist blocks finalize

**Interfaces:**
```ts
export type CompletionCheck =
  | { ok: true }
  | { ok: false; reason: 'checklist_incomplete'; pending: ChecklistItem[]; doneItems: ChecklistItem[] }
  | { ok: false; reason: 'attachment_required' };

export function checkTaskCompletion(task: Task, settings?: BusinessSettings | null): CompletionCheck;
```

- Keep `validateTaskCompletion` as thin wrapper only if needed for tests — prefer migrating call sites to `checkTaskCompletion` + dialog.
- Attachment required → toast/block (no dialog bypass).
- Checklist incomplete → open dialog listing items; on confirm call `moveTask`/`update` to `done`.

- [x] **Step 1: Unit tests for `checkTaskCompletion`**

- [x] **Step 2: Implement checker + dialog**

- [x] **Step 3: Wire three call sites** (+ Kanban bulk toast block)

- [x] **Step 4: PASS + docs + Commit**

```bash
git commit -m "feat: allow completing tasks with incomplete checklist after confirm"
```

---

### Task 11: Final verification + docs sync

- [x] **Step 1: Run** `npm run check` (or lint + `npm run type:check` + `npm run test:run` if check too heavy)

- [x] **Step 2: Skim spec — every phase has matching commits**

- [x] **Step 3: Ensure cron route listed in deploy/docs if Railway cron config exists (`docs/deploy.md`)**

- [x] **Step 4: Commit any doc leftovers**

```bash
git commit -m "docs: sync domain docs after six-phase UX delivery"
```

**Commits de cobertura (dev):** `831fa04` extract events → `50dd35e`/`249e892` planner+preview → `b6dfa8d` cron → `d445066`/`6e7ae4d` active+archive → `33abd67` h+min → `1daa8b4` sectores → `9284878` install → `bacf878`/`e7893e4` checklist+bulk.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| create_event + clarify Evento/Tarea | 2 |
| EventPreview + confirm + reminders mail+notification | 3 |
| Cron avisos Evento mail+push | 4 |
| Archive/delete Project | 6 |
| Archive/delete Location (bug tareas zombi) | 5–6 |
| Hide archived entity tasks | 5 |
| ⏱ h+min | 7 |
| Sectores tabla + finalizadas done+archived | 8 |
| Header Instalar | 9 |
| Checklist confirm, adjunto hard-block | 10 |
| Docs | 3,4,6,8,9,10,11 |

## Self-review notes

- No TBD left in tasks.
- Phase 2 clarified for Location vs Project (matches real user bug).
- Types `ExtractedEvent`, `CompletionCheck`, `EventsMessage` named consistently across tasks.
