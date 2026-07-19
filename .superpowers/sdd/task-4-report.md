# Task 4 Report - Event reminder email + cron

## Status
- DONE

## Scope completed
- Created `src/app/api/cron/event-reminders/route.ts` with `CRON_SECRET` auth
- Created `src/lib/mail/templates/event-reminder-email.tsx`
- Added `MailService.sendEventReminderEmail()`
- Added focused mock-based test coverage in `src/test/cron-event-reminders.test.ts`
- Scheduled internal cron trigger in `src/instrumentation.ts`
- Updated `docs/api-routes.md` and `docs/integrations.md`

## Implementation notes
- Cron mirrors `task-reminders`: checks mañana, hoy y ayer using day boundaries over `CalendarEvent.start`.
- Recipients use `assigneeIds` when present, otherwise fallback to `[creatorId]`.
- Empty `reminders` are treated as default planner behavior, so both notification and email still send.
- Notification titles and email subjects use `📅 Evento mañana`, `📅 Evento hoy`, `📅 Evento pasó`.
- Event email CTA points to `/dashboard/eventos`.

## Files changed
- `src/app/api/cron/event-reminders/route.ts`
- `src/lib/mail/templates/event-reminder-email.tsx`
- `src/services/mail.service.ts`
- `src/instrumentation.ts`
- `src/test/cron-event-reminders.test.ts`
- `docs/api-routes.md`
- `docs/integrations.md`

## Verification
- Focused test: `./node_modules/.bin/vitest run src/test/cron-event-reminders.test.ts`
- Type check: `npm run type:check`
- Lints on edited files: no linter errors

## Commit
- Pending

## Notes / concerns
- Browser/manual smoke for actual cron delivery path was not run.
- Existing unrelated untracked `.superpowers` and `docs/superpowers` files were left untouched.
