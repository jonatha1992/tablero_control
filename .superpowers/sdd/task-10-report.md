# Task 10 Report: Checklist confirm before done

**Status:** Done  
**Branch:** dev

## Changes

- `src/lib/task-validation.ts`: added pure `checkTaskCompletion()` + typed `CompletionCheck`; kept `validateTaskCompletion()` as toast wrapper.
- `src/components/tareas/incomplete-checklist-dialog.tsx`: new shared confirmation dialog for pending checklist items.
- `src/components/tareas/kanban-board.tsx`, `agenda-view.tsx`, `task-detail-modal.tsx`: switched done flow to `checkTaskCompletion()`; attachment rule still hard-blocks with toast, checklist opens confirm dialog.
- `src/test/task-validation.test.ts`: added focused unit coverage for pass case, checklist split, attachment block, and precedence.
- `docs/tasks.md` and `src/app/dashboard/ayuda/page.tsx`: documented new checklist completion behavior.

## Verification

- `./node_modules/.bin/vitest run src/test/task-validation.test.ts`
- `npm run type:check`
