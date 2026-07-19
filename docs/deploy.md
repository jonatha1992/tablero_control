# Deploy — Railway

## Flujo actual

```
push a dev → merge a test → Railway rebuilds automáticamente
```

Branch `test` está conectado a Railway (`tablerocontrol-production`). Cada merge a `test` dispara un redeploy.

## Versionado

Cada `npm run build` (incluido el build de Railway vía Dockerfile) ejecuta `prebuild` → `scripts/bump-version.ts`, que incrementa el patch semver y actualiza la fecha de build en:

- `src/config/version.ts` — fuente de verdad (`APP_VERSION`, `BUILD_DATE`)
- `package.json` — campo `version` sincronizado
- `public/version.json` — consulta externa opcional (`version`, `buildDate`)

El footer del sidebar muestra `vX.Y.Z · YYYY-MM-DD` (sin hash de git). Para verificar la versión desplegada en test: abrir la app y mirar el pie del sidebar, o `GET /version.json`.

## start.sh

```bash
npx prisma db push --accept-data-loss
next start
```

Prisma sincroniza el schema antes de arrancar. `--accept-data-loss` acepta cambios destructivos de schema — tener cuidado con columnas eliminadas en producción.

## Variables de entorno requeridas

```env
DATABASE_URL=                    # Railway lo genera automáticamente al agregar PostgreSQL plugin
FIREBASE_SERVICE_ACCOUNT=        # JSON completo en una sola línea
NEXT_PUBLIC_APP_URL=             # URL de producción (https://...)
MP_ACCESS_TOKEN=APP_USR-...      # Credencial MercadoPago
```

## Variables opcionales

```env
CRON_SECRET=                     # Habilita cron jobs internos (ver instrumentation.ts)
RESEND_API_KEY=                  # Email primario; sin esto usa Gmail SMTP
GMAIL_USER=                      # Gmail SMTP fallback
GMAIL_APP_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GROQ_API_KEY=                    # Transcripción de audio + extracción de tareas con LLM

# Firebase cliente (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gestordetrabajo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gestordetrabajo
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
NEXT_PUBLIC_USE_EMULATOR=false
```

## instrumentation.ts

Al iniciar, conecta a DB y programa cron jobs si `CRON_SECRET` está configurado:

| Schedule | Endpoint | Qué hace |
|----------|----------|----------|
| 6:00 | `POST /api/cron/subscription-expiry` | Vence suscripciones |
| 8:00 | `GET /api/cron/task-reminders` | Avisos de tareas (in-app + FCM) |
| 8:05 | `GET /api/cron/event-reminders` | Avisos de eventos (in-app + FCM + email) |
| Dom 2:00 | `GET /api/cron/attachment-cleanup` | Limpieza de adjuntos huérfanos |

Todos requieren header `Authorization: Bearer {CRON_SECRET}`. Los mails de eventos además necesitan `RESEND_API_KEY` o Gmail SMTP.

## Rollback

Railway → Deployments → click en deploy anterior → "Rollback".

## Dominio custom

Railway → Settings → Domains → "Add Custom Domain" → CNAME en DNS.
Después de configurar: actualizar webhook MP a `https://tudominio.com/api/mercadopago/webhook`.

## Agregar PostgreSQL en Railway

Railway → proyecto → "+ New" → Database → PostgreSQL.
Railway agrega `DATABASE_URL` automáticamente al servicio web.

## Prisma en producción

```bash
# Nunca usar migrate deploy en Railway — usar db push (ya está en start.sh)
# Para ver estado de la DB:
npx prisma studio
```
