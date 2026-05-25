# ADR-005: Firebase FCM con degradación silenciosa

**Estado:** accepted  
**Fecha:** 2026-05-25

## Contexto

Firebase FCM requiere que `FIREBASE_SERVICE_ACCOUNT` esté configurado como variable de entorno (JSON stringificado). En entornos de desarrollo local y en Railway sin esa variable, el Admin SDK falla al inicializar.

La primera implementación dejaba que el error de inicialización propagara, rompiendo cualquier operación que intentara enviar notificaciones — incluyendo flujos críticos como creación de tareas y cambios de status.

## Decisión

FCM se desactiva silenciosamente si las credenciales no están disponibles.

```ts
// src/lib/firebase/admin.ts
function isFcmAvailable(): boolean {
  // retorna false si FIREBASE_SERVICE_ACCOUNT no está configurado
  // o si la inicialización del Admin SDK falló
}
```

El helper `src/lib/notifications.ts`:
1. Crea la `Notification` en PostgreSQL (siempre)
2. Intenta enviar FCM solo si `isFcmAvailable()` retorna true
3. Si FCM falla por token inválido, limpia el token del usuario
4. Si FCM no está disponible, continúa sin error

## Consecuencias

- El sistema funciona correctamente sin `FIREBASE_SERVICE_ACCOUNT` — las notificaciones se guardan en DB pero no se envían como push
- Los push notifications en producción funcionan cuando la variable está configurada en Railway
- Al agregar nuevas notificaciones, siempre usar `src/lib/notifications.ts` — no llamar FCM directamente
- No asumir que FCM está disponible; siempre pasar por el helper
