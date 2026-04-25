# WhatsApp AI — Audio → Tareas (Groq Free Tier)

Integrar WhatsApp Cloud API (Meta oficial) con Groq (Whisper + Llama gratuitos) para que el dueño/responsable de un negocio mande un audio por WhatsApp y el sistema cree las tareas automáticamente en el Tablero de Control, sin abrir la app.

## Stack elegido

```
WhatsApp Audio (OGG)
  ↓  [Meta Cloud API webhook]
Next.js /api/webhooks/whatsapp/route.ts
  ↓  [descarga media de Meta]
Groq Whisper large-v3 (STT — GRATIS)
  ↓  [texto transcripto]
Groq Llama 4 Scout (LLM structured output — GRATIS)
  ↓  [JSON: tareas[]]
Prisma → Task table (taskService.createTask existente)
  ↓
WhatsApp Cloud API → respuesta confirmación al dueño
```

**Costo total: $0** (dentro del free tier de Groq y Meta)

---

## Open Questions

> [!IMPORTANT]
> **¿Tenés cuenta de Meta Business verificada?**
> El webhook de WhatsApp Cloud API requiere verificación del negocio en Meta Business Manager. ¿Ya tenés eso o arrancamos con simulación local (Postman)?

> [!IMPORTANT]
> **¿El feature es para todos los planes o solo Pro+?**
> Recomendación: solo Plan `pro` y `enterprise`. ¿Estás de acuerdo?

---

## Proposed Changes

### 1. Dependencias y Variables de Entorno

#### [MODIFY] package.json
Agregar una sola dependencia nueva:
```bash
npm install groq-sdk
```
(WhatsApp Cloud API se consume con `fetch` nativo — sin SDK extra)

#### [MODIFY] .env.local
```env
# WhatsApp Cloud API (Meta)
WHATSAPP_VERIFY_TOKEN=tu_token_secreto_para_verificar_webhook
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxx...  # de Meta Business
WHATSAPP_PHONE_NUMBER_ID=1234567890  # de Meta Business

# Groq (gratis en console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
```

---

### 2. Modelo Prisma — WhatsAppIntegration

#### [MODIFY] prisma/schema.prisma
Nuevo modelo para guardar la configuración WA por negocio:

```prisma
model WhatsAppIntegration {
  id              String   @id @default(cuid())
  businessId      String   @unique
  phoneNumber     String   // número del dueño autorizado (ej: "5491112345678")
  phoneNumberId   String   // ID del número de Meta
  isActive        Boolean  @default(true)
  audioCount      Int      @default(0)  // contador de audios procesados
  lastUsedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([phoneNumber])
  @@index([businessId])
}
```

Y en `Business` agregar la relación:
```prisma
whatsappIntegration WhatsAppIntegration?
```

---

### 3. Servicio de IA — Groq

#### [NEW] src/lib/groq/client.ts
Cliente Groq reutilizable.

#### [NEW] src/lib/groq/whatsapp-ai.ts
Lógica central con 2 funciones:
- `transcribeAudio(audioBuffer, mimeType)` → Groq Whisper → texto
- `extractTasksFromText(text, context)` → Groq Llama 4 → `ExtractedTask[]`

Tipo `ExtractedTask`:
```typescript
interface ExtractedTask {
  title: string;
  assigneeName?: string;    // nombre mencionado en el audio
  dueDateText?: string;     // "mañana", "el lunes", "esta semana"
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
}
```

---

### 4. Servicio WhatsApp — Meta Cloud API

#### [NEW] src/lib/whatsapp/client.ts
3 funciones simples con `fetch`:
- `downloadMedia(mediaId, accessToken)` → `Buffer` del audio OGG
- `sendTextMessage(to, text, phoneNumberId, accessToken)` → confirma creación
- `verifyWebhookSignature(body, signature, secret)` → seguridad HMAC

---

### 5. Servicio de resolución de asignados

#### [NEW] src/lib/whatsapp/assignee-resolver.ts
Dado un nombre extraído del audio ("Mati", "Juan") busca el `userId` en los miembros del negocio por fuzzy match. Si no encuentra → `null` (la tarea queda sin asignar, con nota en descripción).

---

### 6. Webhook Handler — Ruta principal

#### [NEW] src/app/api/webhooks/whatsapp/route.ts

**GET** — verificación del webhook (Meta exige esto al registrar):
```
?hub.mode=subscribe&hub.verify_token=XXX&hub.challenge=YYY
```

**POST** — procesamiento de mensajes:
1. Validar firma HMAC
2. Extraer mensaje del payload de Meta
3. Si es audio → pipeline completo
4. Si es texto → respuesta de ayuda
5. Ignorar otros tipos (imágenes, stickers, etc.)

Pipeline completo (pasos en el handler):
```
1. Identificar businessId desde phoneNumber → WhatsAppIntegration
2. Verificar plan (solo pro/enterprise)
3. downloadMedia() → buffer OGG
4. transcribeAudio() → texto
5. extractTasksFromText(texto, {miembros, locales}) → tareas[]
6. Para cada tarea: assigneeResolver() + taskService.createTask()
7. sendTextMessage() con resumen de lo creado
8. auditLog task.created.via_whatsapp
```

---

### 7. UI de configuración — Dashboard

#### [NEW] src/app/dashboard/config/whatsapp/page.tsx
Página server component para conectar/desconectar la integración WA del negocio.

#### [NEW] src/components/whatsapp/whatsapp-integration-card.tsx
Card con estado (conectado/desconectado), número configurado, estadísticas de uso (audios procesados, tareas creadas).

#### [MODIFY] src/app/dashboard/config/page.tsx (o el layout de config)
Agregar link a la nueva página de WhatsApp si el plan es pro/enterprise.

---

### 8. API de configuración

#### [NEW] src/app/api/business/whatsapp/route.ts
- `GET` → obtiene configuración actual
- `POST` → guarda número autorizado + activa integración
- `DELETE` → desactiva integración

---

## Orden de ejecución

```
Fase 1 — Backend (sin UI, testeable con Postman/ngrok)
  [1] npm install groq-sdk
  [2] Agregar env vars al .env.local
  [3] Migración Prisma (WhatsAppIntegration)
  [4] src/lib/groq/client.ts + whatsapp-ai.ts
  [5] src/lib/whatsapp/client.ts + assignee-resolver.ts
  [6] src/app/api/webhooks/whatsapp/route.ts
  [7] TEST: Postman → POST al webhook con payload simulado de Meta

Fase 2 — UI
  [8] src/app/api/business/whatsapp/route.ts (CRUD configuración)
  [9] src/components/whatsapp/whatsapp-integration-card.tsx
  [10] src/app/dashboard/config/whatsapp/page.tsx
```

---

## Verification Plan

### Tests automatizados
- Unit test `whatsapp-ai.ts`: mock de Groq SDK, verificar que el JSON output se parsea correctamente
- Unit test `assignee-resolver.ts`: fuzzy match de nombres

### Verificación manual
1. Levantar `npm run dev:all`
2. Exponer con `ngrok http 3000`
3. Registrar webhook en Meta Business Manager con la URL de ngrok
4. Enviar audio real desde WhatsApp → verificar tareas creadas en DB
5. Verificar mensaje de confirmación recibido en WhatsApp

### Notas de seguridad
- Rate limit: máx 500 audios/mes por negocio Pro (evita abuso de free tier Groq)
- Solo se aceptan audios del número registrado en `WhatsAppIntegration.phoneNumber`
- No se guarda la transcripción en DB (privacidad) — solo aparece en el audit log por 30 días
