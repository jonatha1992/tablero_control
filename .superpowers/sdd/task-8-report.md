# Task 8 Report: Sectores table with task counts

**Status:** DONE  
**Branch:** dev

## Summary

Replaced the `SectorList` card grid with a semantic HTML table that shows sector name, type, status, member count, total tasks, completed tasks, and actions. Task totals come from `useTasksQuery()` grouped by `locationId`, with completed totals counting `done` and `archived`.

The row still opens the detail modal, the actions menu keeps edit plus archive/delete, and member counts now support both legacy `locationId` and newer `locationAssignments`.

## Validation

```bash
npm run type:check
```

## Files

- `src/components/sectores/sector-list.tsx`
- `docs/frontend.md`
