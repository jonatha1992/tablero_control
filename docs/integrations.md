# Integraciones externas

## Firebase

### Uso en este proyecto

Firebase se usa **solo para autenticación y push notifications**. No hay Firestore, no hay Firebase Storage.

| Servicio | Uso |
|----------|-----|
| Firebase Auth | ✅ Autenticación JWT |
| FCM | ✅ Push notifications |
| Firestore | ❌ No usado |
| Firebase Storage | ❌ No usado (Cloudinary) |

Proyecto: `gestordetrabajo` | Auth domain: `gestordetrabajo.firebaseapp.com`

### Archivos

```
src/lib/firebase/
  firebase.ts   ← client SDK (solo en 'use client')
  admin.ts      ← admin SDK (solo en server/API routes)
```

**Regla:** Firebase client SDK **solo** en componentes `'use client'`. Admin SDK **solo** en Server Components y API routes.

### Cómo funciona el login

1. Firebase Auth emite token JWT
2. Cliente incluye: `Authorization: Bearer <token>` en cada request
3. `requireUser()` verifica el token con Admin SDK → carga `User` desde PostgreSQL por UID

### Custom claims en Firebase Auth

Al crear/actualizar usuario:
```json
{ "role": "admin", "businessId": "biz-123" }
```

Al cambiar rol:
1. `users.role` en PostgreSQL
2. `auth.setCustomUserClaims(uid, { role, businessId })` con Admin SDK
3. Token se invalida al próximo refresh — forzar con `getIdToken(true)`

### Firebase FCM (Push notifications)

Flujo completo:
1. Cliente solicita permiso de notificaciones
2. Firebase genera `fcmToken` para el dispositivo
3. Token se guarda en `POST /api/users/fcm-token` → `fcmTokens[]` del User en PostgreSQL
4. Al notificar: `src/lib/notifications.ts` → FCM envía al dispositivo
5. Token inválido → se limpia automáticamente del array

```ts
import { isFcmAvailable } from '@/lib/firebase/admin';
// Si FIREBASE_SERVICE_ACCOUNT no está configurado → FCM se desactiva silenciosamente
// Ver decisions/005
```

**Siempre usar el helper centralizado:**
```ts
import { createNotification } from '@/lib/notifications';
await createNotification({ userId, title, body, type, link });
// Crea Notification en DB + envía FCM en una sola llamada
// Limpia tokens inválidos automáticamente
```

### Desarrollo local con emulador

```bash
npm run emulators   # solo Auth emulator
npm run dev:all     # Auth emulator + Next.js
```

Emulador: Auth `localhost:9099` | UI `localhost:4000`

`.env.local`: `NEXT_PUBLIC_USE_EMULATOR=true`

### Variables de entorno

```env
# Admin (secreto)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"gestordetrabajo",...}
# JSON completo en UNA sola línea

# Cliente (público)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gestordetrabajo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gestordetrabajo
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=    # para FCM push (Cloud Messaging → web push certificates)
NEXT_PUBLIC_USE_EMULATOR=false     # false en producción
```

**Cómo obtener FIREBASE_SERVICE_ACCOUNT:**
Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada → copiar JSON completo en una línea.

### Troubleshooting

- `"Firebase Admin not configured"` → verificar que `FIREBASE_SERVICE_ACCOUNT` está en `.env.local` y es JSON en una sola línea
- Emulador no arranca → verificar puerto 9099 libre, instalar Firebase CLI: `npm install -g firebase-tools`

---

## Groq (`src/lib/groq/`)

```ts
// transcribe.ts
transcribeAudio(buffer: Buffer, filename: string): Promise<string>
// Usa Whisper Large V3 Turbo

// extract-context.ts
loadExtractContext(businessId): Promise<ExtractContext>
// Miembros, sedes, tableros, ciclos, objetivos, defaults

// extract-tasks.ts
extractTasksFromTranscription(text, ctx: ExtractContext): Promise<ExtractedTask[]>
// Extrae: título, descripción, prioridad, status, assignees, tags, dueDate, dueTime,
// location, project, cycle, objective, checklist, recurrencia, estimatedHours

// extract-events.ts
extractEventsFromText(text, ctx: ExtractContext): Promise<ExtractedEvent[]>
// Extrae: título, descripción, fecha/hora inicio-fin, allDay, assignees, color

// planner-intent.ts + planner-tools.ts + planner-agent.ts
runPlannerAgent(message, ctx, history): Promise<PlannerResponse>
// clarify | preview_tasks | preview_events | preview_plan | message
```

API routes — tareas:
- `POST /api/tasks/from-audio` — audio → Whisper → extractTasks
- `POST /api/tasks/from-text` — texto → extractTasks

API routes — asistente:
- `POST /api/assistant/chat` — chat informativo (modo `assistant` | `planner` legacy texto)
- `POST /api/assistant/planner` — agente Planificador (intent + preview de tareas/eventos + clarify)
- `POST /api/assistant/generate-plan` — generación de planificación sprint/objetivo

Variables: `GROQ_API_KEY1..N` (ver "Cadena de proveedores de IA" más abajo).

---

## Cadena de proveedores de IA (`src/lib/ai/`)

Tres proveedores, encadenados **por capacidad y no por preferencia**. Verificado
contra las APIs reales el 2026-08-06:

| Tarea | Gemini | Groq | NVIDIA |
|---|---|---|---|
| Texto | sí | sí (`llama-3.3-70b-versatile`) | sí (`nemotron-3-nano-30b-a3b`) |
| Imagen | sí | **no** — GroqCloud no sirve ningún modelo de visión | sí (`nemotron-nano-12b-v2-vl`) |
| Audio | sí | sí (`whisper-large-v3-turbo`) | **no** — no procesa audio |

Esa tabla es el diseño: encadenar "todos para todo" suena mejor y es peor. Mandar
NVIDIA como respaldo de audio no falla cuando se agota la cuota, falla **siempre**,
y con un error que no dice "modalidad equivocada".

| Archivo | Rol |
|---|---|
| `api-keys.ts` | Colector canónico de keys. Limpia BOM y comillas, llega hasta la key 20, acepta lista con comas, descarta placeholders y deduplica. Idéntico en contrato al de los repos Python. |
| `key-pool.ts` | Pool con rotación. Cooldown **según clase de error**: saturación 5 s, cuota 15 min, auth 1 h. Acepta un `deadline` que corta la rotación entera. |
| `pools.ts` | Pools compartidos por proceso. `resetAiPools()` para los tests. |
| `models.ts` | Nombres de modelo en un solo lugar. |
| `nvidia.ts` | Cliente NVIDIA NIM (OpenAI-compatible): texto y visión. |
| `providers.ts` | Registry de texto: Groq → Gemini → NVIDIA. |

**Orden de texto medido** (prompt del planner, JSON, mediana de 3 corridas):
Groq 0.52 s, Gemini `flash-lite-latest` 0.77 s, NVIDIA 2.68 s. Groq primero porque
el planner es interactivo; NVIDIA último porque su valor es tener cuota aparte, no
velocidad.

### Por qué `flash-lite` y no `flash`

`gemini-flash-latest` razona antes de responder, y esos tokens
(`thoughtsTokenCount`, medido entre 383 y 652) se descuentan del **mismo**
`maxOutputTokens`. Con techo 400 la respuesta vuelve con
`finishReason: MAX_TOKENS` y 13 tokens de JSON — cortado. No lo arregla pedir
`responseMimeType: application/json`, porque no es un problema de formato sino de
presupuesto. Los modelos lite razonan 0 tokens y además son 3x más rápidos.

Regla: para JSON, usar lite; o un modelo que razone con techo ≥ 2048.

### Modelos retirados

`gemini-2.5-flash` y `gemini-2.5-flash-lite` responden `404 "no longer available
to new users"`, y toda la familia `gemini-2.0-*` responde `429` con cuota 0 en
free tier. Los alias `-latest` apuntan siempre a un modelo servido, así que no
caducan solos como una versión fijada.

### Cuotas

Gemini limita **por proyecto** de Google Cloud, Groq **por organización** y NVIDIA
**por cuenta**. Sumar keys multiplica cuota sólo si vienen de proyectos o cuentas
distintas.

### Gemini vision para Planificador

`POST /api/assistant/planner` acepta una imagen inline opcional para el chat IA:

```json
{
  "message": "agendá estos finales",
  "image": { "mimeType": "image/png", "base64": "..." }
}
```

Cuando hay imagen **con texto**, `src/lib/ai/vision-image.ts` la convierte en texto normalizado. Ese texto se agrega al mensaje efectivo y luego sigue el flujo existente de `runPlannerAgent`. Si la imagen va **sola** (sin texto), el planner responde primero con `clarify` (`field: kind`, opciones Eventos/Tareas) y recién después de la elección se lee la imagen. No se persiste en Cloudinary ni en base de datos. Límite: una imagen `jpeg|png|webp|gif` de hasta 4 MB.

Cadena de lectura: **Gemini → NVIDIA**, acotada por un presupuesto total
(`AI_VISION_TOTAL_BUDGET_MS`, 60 s por defecto). Groq no participa porque no
tiene ningún modelo con entrada de imagen, así que NVIDIA es el **único**
respaldo posible: sin él, agotada la cuota de Gemini la lectura de imágenes no
degrada, desaparece. Cubierto por `src/test/ai-vision-fallback.test.ts`.

Variables:

```env
GEMINI_API_KEY1=
GEMINI_API_KEY2=
# ... hasta GEMINI_API_KEY20
GROQ_API_KEY1=
GROQ_API_KEY2=
NVIDIA_API_KEY=

# Opcionales (defaults en src/lib/ai/models.ts)
GEMINI_TEXT_MODEL=gemini-flash-lite-latest
GEMINI_VISION_MODEL=gemini-flash-lite-latest
GROQ_TEXT_MODEL=llama-3.3-70b-versatile
NVIDIA_TEXT_MODEL=nvidia/nemotron-3-nano-30b-a3b
NVIDIA_VISION_MODEL=nvidia/nemotron-nano-12b-v2-vl
```

`GOOGLE_AI_API_KEY` se sigue leyendo como nombre legacy, pero el esquema vigente
es el numerado.

---

## Cloudinary (`src/lib/cloudinary/`)

```ts
// upload.ts
uploadUserAvatar(userId: string, file: File): Promise<string>
// → imagen 200×200 optimizada

uploadTaskAttachment(taskId: string, fileName: string, file: File): Promise<string>
// → WebP, quality auto, max 1000px
```

Config: `src/lib/cloudinary/config.ts`  
API route: `POST /api/upload`

Variables:
```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Email (`src/lib/mail/`)

### Templates (react-email)
```
WelcomeEmail, ResetPasswordEmail, TeamInviteEmail
SubscriptionActivatedEmail, SubscriptionExpiryEmail
PaymentSuccessEmail, PaymentFailedEmail, TaskAssignedEmail, EventReminderEmail
```

### Delivery
- **Gmail SMTP** (`src/lib/gmail.ts`) — **primario sin dominio propio**. FROM = `GMAIL_USER` (ej. `tecnofusion.it@gmail.com` + App Password).
- **Resend** (`src/lib/resend.ts`) — solo si `RESEND_API_KEY` está seteada **y** hay dominio verificado (`RESEND_FROM_EMAIL=noreply@tudominio.com`). Sin dominio, Resend con `onboarding@resend.dev` solo entrega al dueño de la cuenta Resend.
- `MailService` elige Resend si hay key; si no, Gmail.
- `MailService.sendEventReminderEmail()` envía recordatorios de eventos para el cron `GET /api/cron/event-reminders`

Variables:
```env
# Sin dominio → usá Gmail (dejá RESEND_API_KEY comentada/vacía)
GMAIL_USER=tecnofusion.it@gmail.com
GMAIL_APP_PASSWORD=

# Con dominio verificado en Resend → descomentá y priorizá Resend
# RESEND_API_KEY=
# RESEND_FROM_EMAIL=noreply@tudominio.com
```

**Resend sin dominio verificado:** no uses Resend; comentá `RESEND_API_KEY` para forzar Gmail.

---

## MercadoPago (`src/lib/mercadopago/`)

Ver `docs/billing.md` para documentación completa.

```
plans.ts       ← definición estática de planes (fallback)
plan-config.ts ← getEffectivePlanConfig, getAllEffectivePlanConfigs (lee DB)
preapproval.ts ← suscripciones recurrentes
```

API client: `src/lib/api/billing.ts` (`billingApi`)

Variables:
```env
MP_ACCESS_TOKEN=APP_USR-...
MP_WEBHOOK_SECRET=...
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...
```
