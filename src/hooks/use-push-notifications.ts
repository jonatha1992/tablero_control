import { useEffect, useState, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase/client';
import { getToken as getFirebaseAuthToken } from '@/lib/firebase/auth';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  // Escuchar notificaciones cuando la app está abierta (foreground)
  useEffect(() => {
    if (typeof window === 'undefined' || !messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Mensaje recibido en foreground: ', payload);
      const title = payload.notification?.title || 'Nueva Notificación';
      const body = payload.notification?.body || '';

      // 1. Mostrar un toast dentro de la app
      toast(title, {
        description: body,
        icon: '🔔',
        duration: 8000,
      });

      // 2. Forzar notificación nativa del SO aunque estemos en la app
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon-cropped.png',
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const subscribeToPushNotifications = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!messaging) {
      toast.error('Las notificaciones push no están soportadas en este navegador.');
      return;
    }

    setIsSubscribing(true);

    try {
      // 1. Pedir permiso al usuario
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission !== 'granted') {
        toast.warning('Permiso denegado para enviar notificaciones.');
        return;
      }

      // 2. Obtener el Token de FCM
      // Nota: Reemplaza NEXT_PUBLIC_FIREBASE_VAPID_KEY con tu clave generada en Firebase Console > Configuración del proyecto > Cloud Messaging > Web configuration (Generar par de claves)
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      
      const currentToken = await getToken(messaging, { vapidKey });

      if (currentToken) {
        // 3. Enviar el token al backend
        const authToken = await getFirebaseAuthToken();
        const res = await fetch('/api/users/fcm-token', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
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
