import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getAdminMessaging, isFcmAvailable } from '@/lib/firebase/admin';

export async function POST(req: import('next/server').NextRequest) {
  try {
    const userOrResponse = await requireUser(req);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }
    const user = userOrResponse;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.uid },
      select: { fcmTokens: true },
    });

    if (!dbUser || !dbUser.fcmTokens || dbUser.fcmTokens.length === 0) {
      return NextResponse.json(
        { error: 'No tienes ningún dispositivo registrado para recibir notificaciones.' },
        { status: 400 }
      );
    }

    if (!isFcmAvailable()) {
      return NextResponse.json(
        { error: 'Push notifications no disponibles — Firebase service account no configurado.' },
        { status: 503 }
      );
    }

    const messaging = getAdminMessaging();

    // Enviar notificación a todos los tokens del usuario
    const responses = await Promise.all(
      dbUser.fcmTokens.map(async (token) => {
        try {
          await messaging.send({
            token,
            notification: {
              title: '¡Prueba exitosa!',
              body: 'Tus notificaciones push están funcionando correctamente en este dispositivo.',
            },
            data: {
              url: '/dashboard/config',
            },
            webpush: {
              fcmOptions: {
                link: '/dashboard/config',
              },
            },
          });
          return { success: true, token };
        } catch (error: unknown) {
          console.error(`[FCM_SEND_ERROR] Token: ${token}`, error);
          const code = (error as { code?: string }).code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            return { success: false, token, remove: true };
          }
          return { success: false, token };
        }
      })
    );

    // Limpiar tokens inválidos
    const tokensToRemove = responses.filter((r) => r.remove).map((r) => r.token);
    if (tokensToRemove.length > 0) {
      const validTokens = dbUser.fcmTokens.filter((t) => !tokensToRemove.includes(t));
      await prisma.user.update({
        where: { id: user.uid },
        data: { fcmTokens: validTokens },
      });
    }

    const successfulCount = responses.filter((r) => r.success).length;

    if (successfulCount === 0) {
      return NextResponse.json(
        { error: 'No se pudo enviar la notificación a ninguno de tus dispositivos.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, count: successfulCount });
  } catch (error: unknown) {
    console.error('[FCM_TEST_POST]', error);
    return NextResponse.json({ error: 'internal_error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
