/**
 * notifications.ts — helper servidor
 * Crea una notificación interna en la BD y, opcionalmente,
 * dispara un push FCM a todos los dispositivos del usuario.
 */
import { prisma } from '@/lib/prisma';
import { getAdminMessaging, isFcmAvailable } from '@/lib/firebase/admin';

interface SendNotificationOptions {
  userId: string;
  title: string;
  body: string;
  type?: string;
  link?: string;
}

export async function sendNotification(opts: SendNotificationOptions) {
  const { userId, title, body, type = 'info', link } = opts;

  // 1. Guardar en la BD
  await prisma.notification.create({
    data: { userId, title, body, type, link },
  });

  // 2. Push FCM (fire-and-forget — no bloquea la respuesta HTTP)
  if (!isFcmAvailable()) return;

  prisma.user.findUnique({
    where: { id: userId },
    select: { fcmTokens: true },
  }).then(async (dbUser) => {
    if (!dbUser?.fcmTokens?.length) return;

    const messaging = getAdminMessaging();
    const invalidTokens: string[] = [];

    await Promise.all(
      dbUser.fcmTokens.map(async (token) => {
        try {
          await messaging.send({
            token,
            notification: { title, body },
            webpush: { fcmOptions: { link: link ?? '/dashboard' } },
          });
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(token);
          }
        }
      })
    );

    // Limpiar tokens inválidos
    if (invalidTokens.length > 0) {
      const valid = dbUser.fcmTokens.filter((t) => !invalidTokens.includes(t));
      await prisma.user.update({ where: { id: userId }, data: { fcmTokens: valid } });
    }
  }).catch(() => { /* silencioso */ });
}
