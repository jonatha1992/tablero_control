import { useEffect, useState, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '@/lib/firebase/client';
import { getToken as getFirebaseAuthToken } from '@/lib/firebase/auth';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    getMessagingInstance().then((m) => {
      // If the component unmounted before the promise resolved, skip registering
      // the listener to prevent orphaned async message handlers (which cause the
      // "message channel closed before a response was received" error).
      if (!m || !isMounted) return;
      cleanup = onMessage(m, (payload) => {
        console.log('Mensaje recibido en foreground: ', payload);
        const title = payload.notification?.title || 'Nueva Notificación';
        const body = payload.notification?.body || '';

        toast(title, {
          description: body,
          icon: '🔔',
          duration: 8000,
        });

        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/icon-cropped.png',
          });
        }
      });
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, []);

  const subscribeToPushNotifications = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const m = await getMessagingInstance();
    if (!m) {
      toast.error('Las notificaciones push no están soportadas en este navegador.');
      return;
    }

    setIsSubscribing(true);

    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission !== 'granted') {
        toast.warning('Permiso denegado para enviar notificaciones.');
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      let swReg: ServiceWorkerRegistration | undefined;
      try {
        swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
          ?? await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch {
        // fallback: let Firebase auto-discover
      }
      const currentToken = await getToken(m, { vapidKey, serviceWorkerRegistration: swReg });

      if (currentToken) {
        const authToken = await getFirebaseAuthToken();
        const res = await fetch('/api/users/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token: currentToken, action: 'add' }),
        });

        if (!res.ok) {
          throw new Error('Error al guardar el token en la base de datos.');
        }

        toast.success('¡Notificaciones activadas exitosamente!');
      } else {
        toast.error('No se pudo obtener el token de notificaciones.');
      }
    } catch (error) {
      console.error('[PUSH_NOTIFICATIONS_ERROR]', error);
      toast.error('Ocurrió un error al intentar suscribirse a las notificaciones.');
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  return {
    permission,
    isSubscribing,
    subscribeToPushNotifications,
  };
};
