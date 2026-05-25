# Facturación con Mercado Pago

## Modelos Prisma

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

## Flujo completo

```
Admin → /dashboard/billing → "Elegir Pro"
  → POST /api/mercadopago/preapproval { plan, frequency, businessId }
    ⚠️  NO enviar payer_email (ver decisions/001)
  → MP crea preapproval → devuelve init_point
  → redirect a checkout de MP
  → usuario completa pago
  → MP hace POST /api/mercadopago/webhook
  → se actualiza subscription.status = 'active'
  → business.plan = 'pro', business.featureFlags actualizado
  → admin vuelve a /dashboard/billing?status=success
```

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
  preapproval.ts   ← suscripciones recurrentes

src/lib/api/billing.ts        ← billingApi (cliente HTTP)
src/app/api/mercadopago/      ← endpoints MP
src/app/api/business/         ← /config, /subscription, /invoices
src/app/api/planes/           ← GET / (público)
src/app/api/cron/subscription-expiry ← cron de vencimientos
```

## API routes de billing

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /api/planes` | Pública | Planes efectivos desde DB |
| `GET /api/superadmin/planes` | superadmin | Planes para panel admin |
| `PATCH /api/superadmin/planes` | superadmin | Editar precio/límite de un plan |
| `POST /api/mercadopago/preapproval` | admin | Inicia checkout en MP |
| `POST /api/mercadopago/recover` | admin | Cancela preapprovals pendientes + crea nueva |
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

`limitProjects` y `limitAttachments` definidos en PlanConfig pero sin enforcement activo aún.

## Cron de vencimientos

`POST /api/cron/subscription-expiry` — verifica suscripciones vencidas + envía emails.
Requiere header `CRON_SECRET`. Se programa en `instrumentation.ts` al iniciar.

## Variables de entorno

```
MP_ACCESS_TOKEN=APP_USR-...           # Credencial del vendedor
MP_WEBHOOK_SECRET=...                 # Para validar firma HMAC
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-... # Solo si usás Bricks
```

## Configurar webhook en MP

1. Ir a MP Developers → Webhooks.
2. Agregar URL: `https://tu-dominio.com/api/mercadopago/webhook`.
3. Eventos: `subscription_preapproval`, `payment`.
4. Copiar el secret → `MP_WEBHOOK_SECRET`.

### Testing local con ngrok

```bash
ngrok http 3000
# Copiar URL https de ngrok al panel de MP como webhook URL
```

## Sandbox

MP provee credenciales de prueba en el panel de developers. Usar `APP_USR-...` del entorno **Test** para `MP_ACCESS_TOKEN`.
