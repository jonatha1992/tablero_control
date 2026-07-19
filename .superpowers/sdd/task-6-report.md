# Task 6 Report

## Status
- Implemented location archive/delete flow in Sectores UI.
- Added project/location archive support in services and `[id]` API routes.
- Fixed hard delete for locations by deleting linked tasks in the same transaction first.

## Verification
- `npm exec vitest run src/test/service-location.test.ts src/test/service-project.test.ts src/test/hooks-locations-query.test.ts src/test/hooks-projects-query.test.ts src/test/api-locations-id.test.ts src/test/api-projects-id.test.ts`
- `npm run type:check`

## Notes
- Sectores dialog now shows associated task count and offers `Archivar` or `Eliminar`.
- Client invalidates both location/project caches and `taskKeys.all` after archive/delete flows.
- Project board-management UI was not added; API/service support is in place.
