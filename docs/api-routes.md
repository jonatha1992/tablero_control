# API Routes — Referencia Completa

Base: `src/app/api/`

## Auth
```
POST /api/auth/register         ← dueño SaaS: crea User + Business + membership (accountIntent: owner)
POST /api/auth/forgot-password
GET  /api/auth/resolve           ← público: username, email o nombre → email Firebase (login pre-auth)
GET  /api/auth/profile          ← superadmin auto-provision si SUPERADMIN_EMAILS; colaboradores: reasigna businessId desde memberships; sin membresías → 404 not_invited. Respuesta: hasOwnedBusiness, canCreateOwnBusiness, isOwner
```

## Invites (público con token Firebase)
```
GET    /api/invites/[token]           ← metadata del link (público)
POST   /api/invites/[token]/prepare-account ← username + email @guest.local (público; valida invite)
POST   /api/invites/[token]/accept    ← membresía al negocio invitador; body opcional `{ username }`; NO crea Business; usuario nuevo → accountIntent: collaborator
GET    /api/invites                   ← listar links (admin)
POST   /api/invites                   ← crear link
DELETE /api/invites/[token]           ← revocar
```

## Tasks
```
GET    /api/tasks               ← TaskFilters: cycleId[]?, noCycle?, priority?, status?, assigneeId?, dueDateFrom?, dueDateTo?, etc.
POST   /api/tasks
PATCH  /api/tasks/[id]
DELETE /api/tasks/[id]
GET    /api/tasks/[id]/comments
POST   /api/tasks/[id]/comments
GET    /api/tasks/[id]/subtasks    ← legacy pausado; UI no lo usa
POST   /api/tasks/[id]/subtasks    ← legacy pausado; UI no lo usa
GET    /api/tasks/[id]/time-entries
POST   /api/tasks/[id]/time-entries
POST   /api/tasks/from-audio    ← Groq Whisper → extracción con LLM + contexto tenant
POST   /api/tasks/from-text     ← extracción LLM desde texto + contexto tenant
```

## Assistant (IA)
```
POST   /api/assistant/chat           ← chat informativo; body: { messages, mode?: 'assistant'|'planner' }
POST   /api/assistant/planner        ← Planificador: intent → clarify | preview_tasks | preview_events | preview_plan
POST   /api/assistant/generate-plan  ← genera planificación sprint/objetivo
```

## Comments / Time Entries
```
PATCH  /api/comments/[id]
DELETE /api/comments/[id]       ← miembro borra propios; admin/responsable borra cualquiera
PATCH  /api/time-entries/[id]
DELETE /api/time-entries/[id]
```

## Cycles
```
GET    /api/cycles
POST   /api/cycles              ← requiere task.create
GET    /api/cycles/[id]
PATCH  /api/cycles/[id]         ← requiere task.update.any
DELETE /api/cycles/[id]         ← requiere task.delete
POST   /api/cycles/[id]/tasks   ← { taskIds: string[], action?: 'assign'|'remove' } — valida cross-tenant
```

## Objectives
```
GET    /api/objectives
POST   /api/objectives
GET    /api/objectives/[id]
PATCH  /api/objectives/[id]
DELETE /api/objectives/[id]
POST   /api/objectives/[id]/tasks  ← { taskIds: string[], action?: 'assign'|'remove' } — valida cross-tenant
```

## Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/[id]
PATCH  /api/projects/[id]
DELETE /api/projects/[id]
```

## Locations
```
GET    /api/locations
POST   /api/locations
PATCH  /api/locations/[id]      ← requiere business.locations.crud
DELETE /api/locations/[id]      ← requiere business.locations.crud
```

## Members / Users
```
GET    /api/members
POST   /api/members
PATCH  /api/members/[id]
DELETE /api/members/[id]

POST   /api/users/create        ← enforcement límite por plan → 429 si excede
POST   /api/users/fcm-token     ← registra token FCM
POST   /api/users/test-fcm      ← envía push de prueba
```

## Notifications
```
GET    /api/notifications
PATCH  /api/notifications/[id]  ← marca como leída
```

## Business
```
POST   /api/businesses              ← opt-in: segundo negocio propio o primer negocio de colaborador (ownerId = uid, membership admin)
GET    /api/business/config
GET    /api/business/subscription
POST   /api/business/subscription
GET    /api/business/invoices
```

## Planes (público)
```
GET    /api/planes              ← lista planes efectivos desde DB (no requiere auth)
```

## Superadmin
```
PATCH  /api/superadmin/planes
GET    /api/superadmin/businesses
POST   /api/superadmin/businesses
GET    /api/superadmin/businesses/[id]
PATCH  /api/superadmin/businesses/[id]
GET    /api/superadmin/users
POST   /api/superadmin/users
GET    /api/superadmin/users/[id]
PATCH  /api/superadmin/users/[id]
POST   /api/superadmin/users/bulk
GET    /api/superadmin/subscriptions
GET    /api/superadmin/subscriptions/[businessId]
GET    /api/superadmin/audit
GET    /api/superadmin/metrics
```

## MercadoPago
```
POST   /api/mercadopago/checkout      ← Checkout Pro (flujo principal)
POST   /api/mercadopago/preapproval   ← DEPRECATED: devuelve 410 Gone
POST   /api/mercadopago/recover       ← crea nuevo checkout si pago pendiente
POST   /api/mercadopago/cancel
POST   /api/mercadopago/sync
POST   /api/mercadopago/webhook
```

## Enforcement de suscripción

`requireActiveSubscription(user, req)` en `auth-helpers.ts` — bloquea mutaciones (POST/PUT/PATCH/DELETE) con 403 `subscription_required` si `business.status === 'suspended'`. GET siempre pasa. Superadmin siempre pasa. Aplicado en: tasks, projects, members, locations, users/create.

## Upload / Cron / Test
```
POST   /api/upload              ← Cloudinary: avatar o attachment de tarea
POST   /api/cron/subscription-expiry  ← requiere CRON_SECRET header
GET    /api/test
POST   /api/test/mail
```
