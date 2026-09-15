# Owner transfer on leaving a space

## Product requirement

An active space owner, including a TecnoFusión platform superadmin, can leave a space after explicitly selecting another active administrator in that same space. The owner loses membership access only if the selected administrator becomes the new owner. The space and its tasks, locations, subscription, and billing history remain intact.

Acceptance criteria: the owner sees the exit action and a required successor selector; an active admin or superadmin membership in the same space is eligible; self, inactive, non-admin, and cross-space users are rejected; ownership, administrative contact, managed locations, and membership change atomically; other users retain the existing leave flow; an owner cannot leave without a successor. No schema migration or changes to global platform privileges are in scope. Success is measured by a successful owner exit without orphaned ownership and by focused API/service/UI tests.

## Technical design

`POST /api/members/leave` accepts optional `newOwnerId`. The route recognizes ownership from the persisted `Business.ownerId` and requires a successor only for an owner. The service transaction rechecks the caller's active membership, the count of other active admins, `Business.ownerId`, and the selected user's active admin/superadmin membership and account in the same business, then updates `Business.ownerId` and `Business.adminId`, reassigns locations managed by the leaving user in that business, deactivates the old membership, and clears the old active-business cache. Authorization never relies on the client list. Serializable conflicts are retried up to three attempts; each attempt rechecks the current state. The existing post-commit claims refresh, auth-cache invalidation, audit log, and navigation remain. Audit writes are awaited before responding.

A platform superadmin with no remaining spaces retains a profile and navigates to `/superadmin`. Billing mail looks up `Business.adminId` through active membership rather than the user's current-space cache, so the new owner receives notices even while another space is active.

Compatibility: non-owner requests without `newOwnerId` keep their current behavior. Existing owner requests without it remain blocked. Rollback: reverting the feature code leaves transferred owners in valid persisted state; any reversal of a completed transfer requires a separate authorized transfer, not a database rollback. Deployment requires no migration.

## Tasks

- [x] Add failing API and service tests for valid owner transfer and invalid successors.
- [x] Add failing UI test for owner selector and enabled exit action.
- [x] Implement atomic owner-transfer leave service and route validation.
- [x] Wire the selector through the client mutation and confirm dialog.
- [x] Update permissions, frontend, billing, integrations, and API documentation; run focused tests, typecheck, and project check.

Security review: successor identity and membership are checked inside the transaction; tenant is the caller's active business; only the current persisted owner may trigger transfer. Operational review: transaction ensures no partial owner/membership state, and existing audit/notification paths are reused.
