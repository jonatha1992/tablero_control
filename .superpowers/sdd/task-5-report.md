# Task 5 Report - Active-entity helper + hide archived location/project tasks

## Status
- DONE

## Scope completed
- Created `src/lib/tasks/active-entity.ts`
- Added TDD coverage in `src/test/active-entity.test.ts`
- Filtered Agenda, Calendario and `/dashboard/tareas` task lists to hide tasks from archived projects and inactive/closed locations
- Updated `ProjectMultiPicker` consumers to exclude archived boards in create/replicate/preview flows
- Updated `docs/tasks.md`

## Implementation notes
- `isArchivedProjectStatus()` treats only `archived` as hidden.
- `isArchivedLocationStatus()` treats `inactive` and `closed` as hidden.
- `isTaskFromActiveEntities()` returns `false` only when linked entity status is archived; missing project/location rows stay visible to avoid false negatives on partial data.
- `ProjectMultiPicker` now removes hidden archived selections from its controlled value so stale IDs do not survive in filters or preview edits.

## Verification
- Focused tests: `./node_modules/.bin/vitest run src/test/active-entity.test.ts src/test/create-task-modal.test.tsx`
- Type check: `npm run type:check`
- Lints on edited files: no linter errors

## Commit
- Pending

## Notes / concerns
- No browser smoke test run for Agenda, Calendario or Kanban after wiring the new helper.
- Existing unrelated untracked `.superpowers` and `docs/superpowers` files were left untouched.
