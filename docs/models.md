# Modelos Prisma — Referencia

## Task

```
id, title, description
status (TaskStatus), priority (TaskPriority), type (TaskType)
creatorId, projectId?, locationId?, parentId?   ← subtareas via parentId
cycleId?, objectiveId?
assignees (User[]), tags (String[])
startDate?, dueDate? (DateTime — incluye hora), completedDate?
estimatedHours?, actualHours?
recurrence (JSON): { frequency, interval, dayOfWeek?, dayOfMonth?, endDate?, count? }
position (Int — orden en kanban), commentCount
attachments (Attachment[]), comments (Comment[]), subtasks (Task[])
```

Enums:
- `TaskStatus`: `backlog | todo | in_progress | in_review | done | blocked`
- `TaskPriority`: `low | medium | high | urgent`
- `TaskType`: `feature | bug | improvement | task | documentation`

## Cycle (Sprints)

```
id, name, goal?, businessId
status (CycleStatus): planning | active | completed | closed
startDate?, endDate?
tasks (Task[])
```

## Objective (Épicas/OKRs)

```
id, name, description?, businessId
status (ObjectiveStatus): active | completed | archived
progress (Int 0-100), dueDate?
tasks (Task[])
```

## User

```
id (Firebase UID), email, name
role (Role), businessId?, locationId?, customRoleId?
avatar?, phone?, isActive (Boolean), lastLogin?
preferences (JSON): {
  theme, locale, timezone,
  notifications: { email, push, agentReports, agentAlerts },
  dashboardLayout[]
}
fcmTokens (String[])        ← tokens FCM para push notifications
memberships (Membership[])  ← historial de negocios del usuario
```

## Business

```
id, name, plan (PlanId), status (BusinessStatus)
logo?, adminId
featureFlags (JSON)
settings (JSON): { maxLocations, maxUsers, features, localeTypes }
trialEndsAt?, suspendedAt?, suspendedReason?
```

Roles: `PlanId = free | basic | pro | enterprise`
`BusinessStatus = active | suspended | trial | cancelled`

## Subscription

```
plan, status (SubscriptionStatus)
mpPreferenceId?, mpPayerId?
amount, currency ('ARS'), frequency (BillingFrequency)
currentPeriodStart?, currentPeriodEnd?, nextBillingDate?
cancelAtPeriodEnd (Boolean), trialEndsAt?
```

## Invoice

```
subscriptionId, businessId
amount, status (InvoiceStatus)
mpPaymentId?, paidAt?, pdfUrl?
```

## PlanConfig

```
id (= plan name: free|basic|pro|enterprise)
priceMonthly, priceYearly
limitUsers, limitLocations, limitProjects, limitAttachments
updatedBy, updatedAt
```

Una fila por plan. Seed: `npx tsx prisma/seed-plan-config.ts`.

## Notification

```
userId, title, body
type: info | task_assigned | task_updated | mention
link?, read (Boolean), createdAt
```

## BusinessInvite

```
token (único), businessId, locationIds (String[])  ← array, no singular
role, expiresAt?, usedAt?
```

Ver decisions/004 — `locationIds` es array pero User solo soporta un `locationId`.

## CustomRole

⚠️ **Almacenado en Firestore, NO en Prisma.**

Colección: `businesses/{businessId}/roles`

```
businessId, name, description?
baseRole (Role): responsable | miembro | viewer
permissions (PermissionSet JSON)
isActive, userCount
createdBy, createdAt, updatedAt
```

Hooks: `use-roles-query.ts` (read) | `use-save-role.ts` (write/delete/toggle)

## Membership

```
userId, businessId, role
isActive (Boolean), joinedAt
```

## AuditLog

```
businessId?, userId?, action (String)
entityType, entityId?, metadata (JSON)
createdAt
```
