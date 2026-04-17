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

## Planes

| Plan       | Precio mensual | Precio anual | Usuarios | Locales |
|------------|---------------|-------------|---------|---------|
| free       | $0            | $0          | 3       | 1       |
| basic      | $3.999 ARS    | $39.990 ARS | 10      | 3       |
| pro        | $9.999 ARS    | $99.990 ARS | 50      | 10      |
| enterprise | A convenir    | A convenir  | ∞       | ∞       |

Precios definidos en `src/lib/mercadopago/plans.ts`.

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

Esto cancela en MP y actualiza `subscription.status = 'cancelled'` en Firestore.

## Colecciones Firestore

- `subscriptions/{id}` — estado de la suscripción.
- `subscriptions/{id}/invoices/{id}` — pagos individuales.

Ambas colecciones son **server-write only** (rules bloquean escritura desde cliente).
