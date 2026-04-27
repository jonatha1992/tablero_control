# Facturación con Mercado Pago

## Modelo

Suscripciones recurrentes via **Preapproval API** de Mercado Pago. Cada `Business` tiene como máximo una suscripción activa.

## Flujo completo

```
Admin → /dashboard/billing → "Elegir Pro"
  → POST /api/mercadopago/preapproval { plan, frequency, businessId }
  → MP crea preapproval → devuelve init_point
  → redirect a checkout de MP
  → usuario completa pago
  → MP hace POST /api/mercadopago/webhook
  → se actualiza subscription.status = 'active'
  → business.plan = 'pro', business.featureFlags actualizado
  → admin vuelve a /dashboard/billing?status=success
```

## Planes y precios (dinámicos)

Los precios y límites se leen desde la tabla `PlanConfig` en PostgreSQL. El superadmin puede modificarlos desde `/superadmin/planes` sin deploy.

| Plan       | Precio mensual base | Precio anual base | Usuarios | Locales |
|------------|--------------------|--------------------|---------|---------|
| free       | $0                 | $0                 | 3       | 1       |
| basic      | $15.000 ARS        | $15.000 ARS        | 10      | 3       |
| pro        | $30.000 ARS        | $30.000 ARS        | 50      | 10      |
| enterprise | $99.000 ARS        | $99.000 ARS        | ∞       | ∞       |

**Nota:** estos valores son los defaults del seed. El superadmin puede cambiarlos en cualquier momento.

### Cómo se leen los precios

- **Componentes de billing** (`billing-plan-cards.tsx`): `GET /api/planes` (público, sin auth) → datos dinámicos desde DB.
- **API routes / server-side**: `getEffectivePlanConfig(planId)` desde `src/lib/mercadopago/plan-config.ts` — lee DB, fallback a `plans.ts` hardcodeado.
- **`billingApi.getPlans()`** en `src/lib/api/billing.ts` → llama `/api/planes`.

## Límite de usuarios por plan

Al crear un usuario (`POST /api/users/create`), el backend verifica el límite:

```
1. Lee business.plan
2. getEffectivePlanConfig(plan).limits.users
3. prisma.user.count({ where: { businessId, isActive: true } })
4. Si count >= limit && limit !== -1 → 429 { error: 'members_limit_exceeded', limit, current }
```

**Nota:** superadmin no tiene este check (puede crear usuarios en cualquier negocio sin restricción).

El modal `create-user-modal.tsx` muestra un bloque de upgrade con link a `/dashboard/billing` cuando recibe `members_limit_exceeded`.

## Variables de entorno

```
MP_ACCESS_TOKEN=APP_USR-...      # Credencial del vendedor
MP_WEBHOOK_SECRET=...            # Para validar firma HMAC
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-... # Solo si usás Bricks
```

## Configurar webhook en MP

1. Ir a [MP Developers → Webhooks](https://www.mercadopago.com.ar/developers/panel/app).
2. Agregar URL: `https://tu-dominio.com/api/mercadopago/webhook`.
3. Eventos: `subscription_preapproval`, `payment`.
4. Copiar el secret y cargarlo en `MP_WEBHOOK_SECRET`.

### Testing local con ngrok

```bash
ngrok http 3000
# Copiar la URL https de ngrok al panel de MP como webhook URL
```

## Sandbox

MP provee credenciales de prueba en el panel de developers. Usar `APP_USR-...` del entorno **Test** para `MP_ACCESS_TOKEN`. Los pagos de prueba no cobran dinero real.

## Cancelar suscripción

```
POST /api/mercadopago/cancel { subscriptionId }
Authorization: Bearer <token del admin>
```

## API routes de billing

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /api/planes` | Pública | Planes efectivos desde DB |
| `GET /api/superadmin/planes` | superadmin | Planes para panel admin |
| `PATCH /api/superadmin/planes` | superadmin | Editar precio/límite de un plan |
| `POST /api/mercadopago/preapproval` | admin | Inicia checkout en MP |
| `POST /api/mercadopago/webhook` | MP (HMAC) | Recibe notificaciones de MP |
| `POST /api/mercadopago/cancel` | admin | Cancela suscripción |
| `POST /api/mercadopago/sync` | admin | Sincroniza estado con MP |
| `POST /api/mercadopago/recover` | admin | Recupera facturas pendientes |
| `GET /api/business/subscription` | admin | Estado de suscripción actual |
| `GET /api/business/invoices` | admin | Historial de facturas |
