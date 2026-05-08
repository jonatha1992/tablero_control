# Firebase — Tablero de Control

## Uso de Firebase en este proyecto

Firebase se usa **exclusivamente para autenticación** (Firebase Auth). No se usa Firestore, Storage ni ningún otro servicio de Firebase — todos los datos de dominio viven en PostgreSQL.

| Servicio Firebase | Uso |
|---|---|
| Firebase Auth | ✅ Autenticación de usuarios (JWT) |
| Firebase Cloud Messaging (FCM) | ✅ Push notifications |
| Firestore | ❌ No usado |
| Firebase Storage | ❌ No usado (se usa Cloudinary) |

---

## Proyecto Firebase

- **Project ID**: `gestordetrabajo`
- **Auth Domain**: `gestordetrabajo.firebaseapp.com`

---

## Desarrollo local con emulador

El emulador se usa solo para **Firebase Auth**. No hay emulador de Firestore.

### 1. Iniciar emulador

```bash
npm run emulators
# o junto con Next.js:
npm run dev:all
```

El emulador de Auth arranca en:
- **Auth**: `http://localhost:9099`
- **UI**: `http://localhost:4000`

### 2. Configurar `.env.local`

```env
NEXT_PUBLIC_USE_EMULATOR=true    # activa el emulador en cliente
```

### 3. Cargar datos de prueba

```bash
npm run seed:pg         # crea usuarios en PostgreSQL
npm run seed:superadmin # crea el superadmin en PostgreSQL
```

Los usuarios de Firebase Auth se crean cuando el usuario se registra por primera vez en `/register` o acepta una invitación. El emulador de Auth los persiste en memoria mientras esté corriendo.

---

## Obtener credenciales para producción

### Firebase Admin (server-side)

1. Firebase Console → Configuración del proyecto → Cuentas de servicio
2. "Generar nueva clave privada" → descarga el JSON
3. Copiar el contenido del JSON completo **en una sola línea** y cargarlo en `FIREBASE_SERVICE_ACCOUNT`

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"gestordetrabajo",...}
```

### Firebase Client (cliente — variables NEXT_PUBLIC_*)

Obtener desde: Firebase Console → Configuración del proyecto → Apps web → SDK snippet

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gestordetrabajo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gestordetrabajo
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=    # Necesario para push notifications (FCM)
NEXT_PUBLIC_USE_EMULATOR=false     # false en producción
```

### VAPID Key (para push notifications)

1. Firebase Console → Cloud Messaging → Configuración web → "Generar par de claves web"
2. Copiar la clave pública (VAPID Key) en `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

---

## Push Notifications (FCM)

El sistema usa Firebase Cloud Messaging para notificaciones push. Flujo:

1. El cliente solicita permiso de notificaciones al usuario
2. Firebase genera un `fcmToken` para el dispositivo
3. El token se guarda en `POST /api/users/fcm-token` → campo `fcmTokens[]` del User en PostgreSQL
4. Al disparar una notificación: `src/lib/notifications.ts` → `sendFcmNotification()` → FCM envía al dispositivo
5. Si el token está expirado/inválido, se limpia automáticamente del array

Helper centralizado:
```typescript
// Siempre usar este helper — crea Notification en DB + envía FCM en una llamada
import { createNotification } from '@/lib/notifications';
await createNotification({ userId, title, body, type, link });
```

---

## Autenticación — cómo funciona

### Login

1. Firebase Auth emite token JWT
2. El cliente guarda el token (gestionado por Firebase SDK)
3. Cada request incluye: `Authorization: Bearer <token>`
4. `requireUser()` (`src/lib/api/auth-helpers.ts`) verifica el token con Admin SDK
5. Carga el `User` completo desde PostgreSQL por el UID de Firebase

### Auto-provisioning de superadmin

Al hacer `GET /api/auth/profile`, si el email del usuario está en `SUPERADMIN_EMAILS`:
- Se crea el User en PostgreSQL con `role: 'superadmin'` si no existe
- Se redirige automáticamente a `/superadmin`

### Custom claims en Firebase Auth

Al crear/actualizar un usuario se setean custom claims para validación rápida:
```json
{ "role": "admin", "businessId": "biz-123" }
```

Al cambiar el rol de un usuario:
1. Actualizar `users.role` en PostgreSQL
2. Llamar `auth.setCustomUserClaims(uid, { role, businessId })` con Admin SDK
3. El token se invalida al próximo refresh (forzar con `getIdToken(true)`)

---

## Configurar proveedores de autenticación

En Firebase Console → Authentication → Sign-in method:
- **Email/Password**: habilitado
- **Google**: habilitado (configurar dominio autorizado)

Para producción, agregar el dominio del deploy en Firebase Console → Authentication → Authorized domains.

---

## Troubleshooting

### "Firebase Admin not configured"
- Verificar que `FIREBASE_SERVICE_ACCOUNT` está en `.env.local`
- El JSON debe estar en una sola línea (sin saltos de línea)

### El emulador no arranca
- Verificar que el puerto 9099 está libre: `netstat -an | grep 9099`
- Instalar Firebase CLI globalmente si no está: `npm install -g firebase-tools`

### Tokens expirados en tests
- El mock de `requireUser()` devuelve directamente el `authedUser` sin verificar Firebase
- Ver `docs/testing.md` para el patrón correcto de mocks en tests de API routes
