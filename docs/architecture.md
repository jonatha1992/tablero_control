# Arquitectura del sistema

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 App Router |
| React | 19 + TypeScript strict |
| CSS | Tailwind CSS 4 |
| UI | Radix UI + shadcn/ui |
| Estado client | Zustand 5 |
| Estado server | TanStack Query 5 |
| Backend | Firebase (Auth, Firestore, Storage) |
| Pagos | Mercado Pago (preapproval) |
| Archivos | Cloudinary |
| Testing | Vitest + Testing Library + Firebase Emulator |

## Capas de la aplicación

```
Browser
  └── Next.js App Router
        ├── (auth)/         → Login, registro
        ├── (superadmin)/   → Panel TecnoFusión (rol superadmin)
        └── dashboard/      → Aplicación cliente
              ├── tareas/
              ├── calendario/
              ├── reportes/
              ├── equipo/
              ├── billing/    ← suscripción MP
              └── config/     ← roles, perfil, preferencias

API Routes (server, Node.js):
  ├── /api/upload             → Cloudinary
  ├── /api/mercadopago/
  │     ├── preapproval       → crea suscripción
  │     ├── webhook           → recibe notificaciones MP
  │     └── cancel            → cancela suscripción
  └── /api/superadmin/
        ├── businesses        → CRUD negocios
        └── metrics           → KPIs plataforma

Lib (lógica de negocio):
  ├── lib/firebase/           → client, admin, auth, firestore, storage
  ├── lib/mercadopago/        → client, preapproval, plans
  ├── lib/permissions/        → matrix, resolve, tenant-guard, validate-role
  └── lib/api/                → auth-helpers, audit

Hooks:
  ├── hooks/queries/          → TanStack Query (datos Firebase)
  └── hooks/mutations/        → TanStack mutations (escrituras)

Stores (UI state):
  └── stores/                 → Zustand (kanban UI, modales, filtros)
```

## Flujo de datos

```
Componente → hook (useQuery/useMutation)
          → repository (task.repository.ts)
          → firestore.ts (helpers genéricos)
          → Firebase Firestore
```

Para acciones server-side (billing, admin):
```
Componente → fetch /api/...
          → route.ts
          → lib/firebase/admin (Admin SDK)
          → Firestore (con permisos admin, bypasa rules)
          → writeAuditLog (async, no bloquea respuesta)
```

## Multi-tenancy

- `businessId` en todos los documentos de clientes.
- Queries siempre filtradas: `where('businessId', '==', user.businessId)`.
- Firestore rules validan tenant via custom claims (`request.auth.token.businessId`).
- Superadmin (`businessId = null`) accede a todos los tenants.

## Seguridad (defensa en profundidad)

1. **UI**: `can(user, action)` oculta botones y rutas.
2. **API routes**: `requireUser()` + `assertSameTenant()`.
3. **Firestore rules**: validación final, no se puede bypassar desde cliente.
4. **Storage rules**: scoped por businessId, límite 10MB, MIME allowlist.
