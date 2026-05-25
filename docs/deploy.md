# Deploy — Railway

## Flujo actual

```
push a dev → merge a test → Railway rebuilds automáticamente
```

Branch `test` está conectado a Railway (`tablerocontrol-production`). Cada merge a `test` dispara un redeploy.

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
CRON_SECRET=                     # Habilita cron jobs internos (subscription-expiry)
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

Al iniciar, conecta a DB y programa cron jobs si `CRON_SECRET` está configurado.

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
