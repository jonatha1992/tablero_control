# ADR 008: Transfer ownership when an owner leaves

Status: accepted for implementation.

The current leave endpoint blocks `Business.ownerId`, so TecnoFusión cannot leave a space it owns. `ownerId` is a required foreign key, while `adminId` is used for billing and administrative contact. Deactivating the owner membership without updating both references would leave stale ownership and routing.

Options considered: require a separate ownership transfer before leaving; automatically choose an admin; or require an explicit successor and perform transfer plus leave atomically. The separate workflow can leave a transferred former owner in the space if the second action fails. Automatic selection silently gives ownership to someone the caller did not choose.

Decision: require an explicit active admin/superadmin successor from the same space and update `ownerId`, `adminId`, and the old owner's membership in one transaction. Revalidate persisted ownership and successor eligibility inside that transaction. A platform superadmin's global role remains unchanged; only the space membership is deactivated.

Consequences: owner exit needs a selector and cannot proceed when no eligible admin exists. Non-owner exit keeps its existing request contract. No data migration is required.

The platform superadmin may have no active space after leaving. Its profile and global access remain valid; the exit flow routes it to `/superadmin`. Billing notices follow the new `adminId` through business membership, independently of which space that user currently has open.
