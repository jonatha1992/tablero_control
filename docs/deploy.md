# Deploy — Vercel

## Flujo actual

```
push a main/test (según proyecto) → Vercel redeploy automático
```

Proyecto Vercel: `tablero-control`  
URL estable: `https://tablero-control-self.vercel.app`  
Deployments: `https://tablero-control-*.vercel.app`

> **Migración:** el hosting web ya no está en Railway. Railway puede seguir
> usándose solo como **Postgres** (`DATABASE_URL` / proxy `rlwy.net`).
> Cualquier URL `*.up.railway.app` para la app está muerta (404).

## Versionado

Cada `npm run build` ejecuta `prebuild` → `scripts/bump-version.ts`, que incrementa el patch semver y actualiza la fecha de build en:

- `src/config/version.ts` — fuente de verdad (`APP_VERSION`, `BUILD_DATE`)
- `package.json` — campo `version` sincronizado
- `public/version.json` — consulta externa opcional (`version`, `buildDate`)

El footer del sidebar muestra `vX.Y.Z · YYYY-MM-DD`. Para verificar la versión desplegada: pie del sidebar o `GET /version.json`.

### PWA cache vs deploys en Vercel

El Service Worker (`public/sw.js`) **no** cachea navegaciones/HTML ni `/version.json` (solo assets estáticos con fallback offline). Cache name actual: `tablero-v2` (al activarse borra caches viejos como `tablero-v1`).

Si un usuario sigue viendo UI vieja tras un deploy:

1. Comparar pie del sidebar vs `GET /version.json` en el host Vercel.
2. Ir a **Configuración → Instalación de la Aplicación → Actualizar app (limpiar cache)**.
3. Esa acción (`forceAppUpdate` en `src/lib/pwa/force-app-update.ts`) borra Cache Storage, desregistra SWs y recarga con `?_refresh=…`.

**Instalar** (header / home) ≠ **Actualizar**. Instalar agrega la PWA; Actualizar fuerza shell fresco post-deploy.

## Prisma / schema en producción

En Vercel no corre `start.sh` de Railway. Sincronizar schema aparte cuando haga falta:

```bash
npx prisma db push
# o migrate según el flujo del equipo
```

## Variables de entorno requeridas (Vercel → Settings → Environment Variables)

```env
DATABASE_URL=                    # Postgres (puede seguir siendo Railway DB)
FIREBASE_SERVICE_ACCOUNT=        # JSON completo en una sola línea
NEXT_PUBLIC_APP_URL=             # URL pública Vercel (https://tablero-control-self.vercel.app o dominio custom)
MP_ACCESS_TOKEN=APP_USR-...      # Credencial MercadoPago
MP_CALLBACK_URL=                 # Misma base pública Vercel (NO *.up.railway.app)
```

**Crítico post-migración:** `NEXT_PUBLIC_APP_URL` y `MP_CALLBACK_URL` deben apuntar a Vercel (o dominio custom). Si quedan en `tablerocontrol-production.up.railway.app`, los links de invitación / webhooks MP van a un host 404.

Tras cambiar `NEXT_PUBLIC_*`, hace falta **redeploy** (las vars públicas se inyectan en build).

## Variables opcionales

```env
CRON_SECRET=                     # Habilita cron jobs internos (ver instrumentation.ts)
RESEND_API_KEY=                  # Email primario (Resend); sin esto usa Gmail SMTP
RESEND_FROM_EMAIL=               # Remitente Resend (default onboarding@resend.dev)
GMAIL_USER=                      # Gmail SMTP fallback
GMAIL_APP_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GROQ_API_KEY=                    # Transcripción de audio + extracción de tareas con LLM
GOOGLE_AI_API_KEY=               # Gemini vision para imagenes en el chat IA del Planificador
MP_WEBHOOK_BASE_URL=             # Opcional; fallback = NEXT_PUBLIC_APP_URL

# Firebase cliente (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gestordetrabajo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gestordetrabajo
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
NEXT_PUBLIC_USE_EMULATOR=false
```

## instrumentation.ts / crons

En Vercel, los cron de `instrumentation.ts` pueden no comportarse igual que en un proceso Node 24/7. Preferir [Vercel Cron](https://vercel.com/docs/cron-jobs) o un scheduler externo contra los endpoints:

| Schedule | Endpoint | Qué hace |
|----------|----------|----------|
| 6:00 | `POST /api/cron/subscription-expiry` | Vence suscripciones |
| 8:00 | `GET /api/cron/task-reminders` | Avisos de tareas (in-app + FCM) |
| 8:05 | `GET /api/cron/event-reminders` | Avisos de eventos (in-app + FCM + email) |
| Dom 2:00 | `GET /api/cron/attachment-cleanup` | Limpieza de adjuntos huérfanos |

Todos requieren header `Authorization: Bearer {CRON_SECRET}`.

## Rollback

Vercel → Deployments → deploy anterior → "Promote to Production" / Rollback.

## Dominio custom

Vercel → Project → Settings → Domains → agregar dominio → CNAME/A según panel.
Después: actualizar `NEXT_PUBLIC_APP_URL`, `MP_CALLBACK_URL` y webhook MP a `https://tudominio.com/...`.

## Firebase Auth authorized domains

Firebase Console → Authentication → Settings → Authorized domains: agregar el host Vercel (`tablero-control-self.vercel.app` y dominio custom si aplica). Sin esto, Google login falla en prod.
