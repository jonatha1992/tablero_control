# Facturación con Mercado Pago

## Modelos Prisma

Los avisos por webhook y por cron usan `Business.adminId` y resuelven el correo desde una membresía admin/superadmin activa de ese negocio (`findBusinessAdminEmail`). Esto permite que el nuevo propietario elegido en un traspaso reciba los avisos aunque tenga otro espacio abierto. Una membresía o cuenta desactivada no recibe correo.

### Subscription
```
plan, status (SubscriptionStatus), mpPreferenceId?, mpPayerId?
amount, currency('ARS'), frequency (BillingFrequency)
currentPeriodStart?, currentPeriodEnd?, nextBillingDate?
cancelAtPeriodEnd, trialEndsAt?
```

### Invoice
```
subscriptionId, businessId, amount
status (InvoiceStatus), mpPaymentId?, paidAt?, pdfUrl?
```

### PlanConfig
Una fila por plan (`free/basic/pro/enterprise`):
```
priceMonthly, priceYearly
limitUsers, limitLocations, limitProjects, limitAttachments
updatedBy
```
Seed: `npx tsx prisma/seed-plan-config.ts`
Superadmin edita desde `/superadmin/planes`.

## Flujo de pago (Checkout Pro)

El sistema usa **Checkout Pro** de MP — no preapproval. Cualquier cuenta MP puede pagar. La renovación es manual: el sistema muestra el botón de renovar cuando vence el período.

```
Admin → /dashboard/billing → "Elegir Pro"
  → POST /api/mercadopago/checkout { plan, frequency, businessId }
  → MP crea preference → devuelve init_point
  → redirect a checkout de MP (cualquier cuenta puede pagar)
  → usuario completa pago
  → MP hace POST /api/mercadopago/webhook (notificationUrl = MP_CALLBACK_URL)
  → webhook activa subscription.status = 'active'
  → business.plan = 'pro', currentPeriodEnd = now + 30/365 días
  → admin vuelve a /dashboard/billing?status=success
```

### Por qué Checkout Pro y no preapproval

La API de preapproval de MP requiere `payer_email` obligatorio (400 si se omite). Cuando se especifica `payer_email`, MP restringe el pago a esa cuenta específica — rompe el flujo cuando quien paga es diferente a quien inició el checkout. Checkout Pro no tiene esa restricción.

Ver `docs/decisions/001-no-payer-email-mp.md` (estado: superseded).

### Renovación manual

MP ya no maneja la recurrencia. Cuando `currentPeriodEnd` vence:
1. Cron `subscription-expiry` marca `status = 'past_due'` → `business.status = 'suspended'`
2. Las APIs de escritura devuelven 403 `subscription_required`
3. El usuario ve el aviso en `/dashboard/billing` y vuelve a pagar

## Lifecycle de suscripción

### Estados de Subscription

| Estado | Descripción |
|--------|-------------|
| `pending` | Checkout iniciado, pago no completado |
| `active` | Pago aprobado, período vigente |
| `past_due` | Período vencido, business suspendido |
| `cancelled` | Cancelado (manual o `cancelAtPeriodEnd`) |
| `paused` | Pausa temporal |
| `trialing` | Período de prueba |

### Enforcement de acceso

`requireActiveSubscription(user, req)` en `src/lib/api/auth-helpers.ts`:
- Solo bloquea mutaciones (POST/PUT/PATCH/DELETE)
- GET siempre pasa — el usuario puede leer datos y acceder a billing
- Superadmin nunca bloqueado
- Retorna 403 `{ error: 'subscription_required' }` si `business.status === 'suspended'`

Aplicado en routes de: tasks, projects, members, locations, users/create.
**NO aplicado en**: `/api/mercadopago/**`, `/api/business/subscription`, `/api/planes`.

### cancelAtPeriodEnd

Cuando `cancelAtPeriodEnd = true`, el cron de vencimientos cancela la suscripción al vencer el período (`status → 'cancelled'`, `business.status → 'cancelled'`). Lo setea `POST /api/mercadopago/cancel`.

## Planes y precios (dinámicos)

Los precios y límites se leen desde `PlanConfig` en PostgreSQL. El superadmin puede modificarlos desde `/superadmin/planes` sin deploy.

| Plan       | Precio mensual base | Precio anual base | Usuarios | Locales |
|------------|--------------------|--------------------|---------|---------|
| free       | $0                 | $0                 | 3       | 1       |
| basic      | $15.000 ARS        | $15.000 ARS        | 10      | 3       |
| pro        | $30.000 ARS        | $30.000 ARS        | 50      | 10      |
| enterprise | $99.000 ARS        | $99.000 ARS        | ∞       | ∞       |

Estos valores son defaults del seed — superadmin puede cambiarlos.

### Cómo se leen los precios

- **Componentes de billing** (`billing-plan-cards.tsx`): `GET /api/planes` (público, sin auth) → datos dinámicos desde DB.
- **API routes / server-side**: `getEffectivePlanConfig(planId)` desde `src/lib/mercadopago/plan-config.ts` — lee DB, fallback a `plans.ts` hardcodeado.
- **`billingApi.getPlans()`** en `src/lib/api/billing.ts` → llama `/api/planes`.

## Archivos relevantes

```
src/lib/mercadopago/
  plans.ts         ← definición estática de planes (fallback)
  plan-config.ts   ← getEffectivePlanConfig, getAllEffectivePlanConfigs
  preapproval.ts   ← getPreapproval, cancelPreapproval (solo para compat. webhooks viejos)
  preference.ts    ← createCheckoutPreference (Checkout Pro)

src/lib/api/
  auth-helpers.ts  ← requireUser, requireRole, requireActiveSubscription

src/lib/api/billing.ts                    ← billingApi (cliente HTTP)
src/app/api/mercadopago/checkout/         ← endpoint principal de checkout
src/app/api/mercadopago/recover/          ← reintenta checkout pendiente
src/app/api/mercadopago/webhook/          ← recibe notificaciones MP
src/app/api/mercadopago/cancel/           ← cancela suscripción
src/app/api/mercadopago/sync/             ← sincroniza estado local
src/app/api/mercadopago/preapproval/      ← DEPRECATED: devuelve 410 Gone
src/app/api/cron/subscription-expiry/     ← cron de vencimientos
```

## API routes de billing

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /api/planes` | Pública | Planes efectivos desde DB |
| `GET /api/superadmin/planes` | superadmin | Planes para panel admin |
| `PATCH /api/superadmin/planes` | superadmin | Editar precio/límite de un plan |
| `POST /api/mercadopago/checkout` | admin | Inicia Checkout Pro en MP |
| `POST /api/mercadopago/preapproval` | — | **DEPRECATED** — devuelve 410 |
| `POST /api/mercadopago/recover` | admin | Crea nuevo checkout si pago pendiente |
| `POST /api/mercadopago/webhook` | MP (HMAC) | Recibe notificaciones de MP |
| `POST /api/mercadopago/cancel` | admin | Cancela suscripción |
| `POST /api/mercadopago/sync` | admin | Sincroniza estado con MP |
| `GET /api/business/subscription` | admin | Estado de suscripción actual |
| `GET /api/business/invoices` | admin | Historial de facturas |

## Límite de usuarios por plan

Al crear usuario (`POST /api/users/create`):
```
1. Lee business.plan
2. getEffectivePlanConfig(plan).limits.users
3. prisma.user.count({ where: { businessId, isActive: true } })
4. Si count >= limit && limit !== -1 → 429 { error: 'members_limit_exceeded', limit, current }
```

`create-user-modal.tsx` muestra bloque de upgrade con link a `/dashboard/billing` cuando recibe `members_limit_exceeded`.

`limitProjects` (UI: tableros por espacio) tiene enforcement en `project.service.ts`. `limitAttachments` definido en PlanConfig; enforcement según integración de adjuntos.

Límites aplican **por espacio** (`Business`), no por usuario: usuarios, sedes (`limitLocations`), tableros (`limitProjects`), adjuntos/mes.

Al crear un espacio (`POST /api/auth/register`, `POST /api/businesses`), se crea automáticamente un tablero **Principal** vía `ensureDefaultBoard()`. Espacios existentes sin tablero: `npx tsx scripts/ensure-default-boards.ts`.

## Cron de vencimientos (`/api/cron/subscription-expiry`)

Requiere header `Authorization: Bearer {CRON_SECRET}`.

Lo que hace por orden:
1. **Trials vencidos** → `business.status = 'suspended'`
2. **Suscripciones vencidas** → `subscription.status = 'past_due'` + `business.status = 'suspended'`
3. **cancelAtPeriodEnd** → si `currentPeriodEnd < now && cancelAtPeriodEnd = true` → `status = 'cancelled'`
4. **Emails de aviso** → 7 días antes del vencimiento al admin del business

Respuesta: `{ ok, markedPastDue, trialExpired, cancelledAtPeriodEnd, emailsSent }`

## Variables de entorno

```
MP_ACCESS_TOKEN=APP_USR-...    # Credencial del vendedor (real: APP_USR-, sandbox: TEST-)
MP_PUBLIC_KEY=APP_USR-...      # Clave pública MP
MP_WEBHOOK_SECRET=...          # Para validar firma HMAC del webhook
MP_CALLBACK_URL=https://...    # URL pública Vercel (o dominio custom) — NO *.up.railway.app
MP_ENV=production              # 'production' con credenciales reales / 'test' con TEST- token
MP_TEST_PAYER_EMAIL=...        # Solo en MP_ENV=test (debe ser test_user_...@testuser.com)
CRON_SECRET=...                # Bearer token para el cron
```

### MP_ENV y credenciales

Con `MP_ENV=production` + `APP_USR-` token: usa email real del admin como `payer_email`.  
Con `MP_ENV=test` + `TEST-` token: usa `MP_TEST_PAYER_EMAIL` (debe ser cuenta test de MP).  
**Nunca mezclar**: `APP_USR-` (real) + `MP_ENV=test` → MP rechaza con "Both payer and collector must be real or test users".

## Configurar webhook en MP

1. Ir a MP Developers → Webhooks.
2. Agregar URL: `https://tu-dominio.com/api/mercadopago/webhook`.
3. Eventos: `payment`.
4. Copiar el secret → `MP_WEBHOOK_SECRET`.

### Desarrollo local con Railway DB

El checkout crea la preference en MP → `notificationUrl` apunta a `MP_CALLBACK_URL` (Railway), no a localhost. El pago sucede en MP. Railway recibe el webhook y actualiza el DB compartido. Localhost lee el mismo DB → funciona sin ngrok.
