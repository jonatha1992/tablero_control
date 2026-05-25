# API Routes — Referencia Completa

Base: `src/app/api/`

## Auth
```
POST /api/auth/register
POST /api/auth/forgot-password
GET  /api/auth/profile          ← auto-provisiona superadmin si email en SUPERADMIN_EMAILS
```

## Tasks
```
GET    /api/tasks               ← TaskFilters: cycleId[]?, noCycle?, priority?, status?, etc.
POST   /api/tasks
PATCH  /api/tasks/[id]
DELETE /api/tasks/[id]
GET    /api/tasks/[id]/comments
POST   /api/tasks/[id]/comments
GET    /api/tasks/[id]/subtasks
POST   /api/tasks/[id]/subtasks
GET    /api/tasks/[id]/time-entries
POST   /api/tasks/[id]/time-entries
POST   /api/tasks/from-audio    ← Groq Whisper → extracción con LLM
POST   /api/tasks/from-text     ← extracción LLM desde texto
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
POST   /api/mercadopago/checkout
POST   /api/mercadopago/preapproval   ← NO enviar payer_email (ver decisions/001)
POST   /api/mercadopago/recover       ← cancela pendientes + crea nueva
POST   /api/mercadopago/cancel
POST   /api/mercadopago/sync
POST   /api/mercadopago/webhook
```

## Upload / Cron / Test
```
POST   /api/upload              ← Cloudinary: avatar o attachment de tarea
POST   /api/cron/subscription-expiry  ← requiere CRON_SECRET header
GET    /api/test
POST   /api/test/mail
```
