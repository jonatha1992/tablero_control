# Task 2 Report - Planner create_event intent + preview_events

## Status
- DONE

## Scope completed
- Extended `PlannerIntentType` with `create_event`
- Extended `PlannerResponse` with `preview_events`
- Wired planner pipeline to call `extractEventsFromText`
- Forwarded `preview_events` through `runPlannerAgent`
- Extended focused tests in `src/test/planner-intent.test.ts`
- Updated planner-related docs in `docs/tasks.md`, `docs/api-routes.md`, and `docs/integrations.md`
- Prepared commit on branch `dev`

## TDD evidence

### RED
Command:
```bash
./node_modules/.bin/vitest run src/test/planner-intent.test.ts
```

Result:
```text
FAIL  src/test/planner-intent.test.ts > runIntentPipeline > devuelve preview_events para create_event
AssertionError: expected 'clarify' to be 'preview_events'
```

Meaning:
- New event-preview test failed for expected reason.
- Pipeline still treated `create_event` as unsupported and fell back to clarify.

### GREEN
Command:
```bash
./node_modules/.bin/vitest run src/test/planner-intent.test.ts
```

Result:
```text
Test Files  1 passed (1)
Tests       4 passed (4)
```

Meaning:
- Event preview path now returns `preview_events`.
- Clarification path for ambiguous event-vs-task intent still works.

## Implementation notes
- Updated planner intent prompt so classifier can emit `create_event` for event-like requests such as exam, meeting, appointment, or reminder wording.
- Added explicit ambiguity rule: if request could be either task or event, classifier should ask for `kind` with `Evento` / `Tarea` options.
- Added `extract_events` tool branch in `planner-tools.ts` using Task 1 `extractEventsFromText`.
- Added `create_event` pipeline branch:
  - empty extraction => `clarify`
  - successful extraction => `preview_events`
  - runtime failure => `message`
- Kept Task 3 boundary intact: no event confirmation UI or persistence flow added.

## Files changed
- `src/lib/groq/planner-intent.ts`
- `src/lib/groq/planner-types.ts`
- `src/lib/groq/planner-tools.ts`
- `src/lib/groq/planner-agent.ts`
- `src/test/planner-intent.test.ts`
- `docs/tasks.md`
- `docs/api-routes.md`
- `docs/integrations.md`

## Verification
- Focused test: `./node_modules/.bin/vitest run src/test/planner-intent.test.ts`
- Type check: `npm run type:check`
- Lints on edited files: no linter errors

## Commit
- Pending at report creation time

## Notes / concerns
- `preview_events` is now available from planner backend, but chat UI still has no dedicated rendering/confirmation path for that response type. That remains Task 3 work.
