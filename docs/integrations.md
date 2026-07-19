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
// clarify | preview_tasks | preview_plan | message
```

API routes — tareas:
- `POST /api/tasks/from-audio` — audio → Whisper → extractTasks
- `POST /api/tasks/from-text` — texto → extractTasks

API routes — asistente:
- `POST /api/assistant/chat` — chat informativo (modo `assistant` | `planner` legacy texto)
- `POST /api/assistant/planner` — agente Planificador (intent + preview + clarify)
- `POST /api/assistant/generate-plan` — generación de planificación sprint/objetivo

Variable: `GROQ_API_KEY` (rotación multi-provider vía `src/lib/ai/providers.ts` cuando aplica)

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
PaymentSuccessEmail, PaymentFailedEmail, TaskAssignedEmail
```

### Delivery
- **Resend** (`src/lib/resend.ts`) — primario si `RESEND_API_KEY` configurado
- **Gmail SMTP** (`src/lib/gmail.ts`) — fallback automático

Variables:
```env
RESEND_API_KEY=         # si no está, usa Gmail SMTP
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

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
