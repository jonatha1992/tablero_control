'use client';

import { Smartphone, Loader2, BellRing, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { getToken } from '@/lib/firebase/auth';
import { useState } from 'react';

const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true);

export function PushNotificationToggle() {
  const { permission, isSubscribing, subscribeToPushNotifications } = usePushNotifications();
  const [isTesting, setIsTesting] = useState(false);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones push.');
      return;
    }

    if (permission === 'denied') {
      toast.error('Notificaciones bloqueadas. Para activarlas, hacé clic en el ícono del candado (🔒) en la barra de tu navegador y habilitá los permisos.');
      return;
    }

    if (permission === 'granted') {
      toast.info('Para desactivar las notificaciones, revocá el permiso desde el ícono del candado (🔒) en la barra de tu navegador.');
      return;
    }

    await subscribeToPushNotifications();
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/users/test-fcm', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'No tienes ningún dispositivo registrado para recibir notificaciones.') {
          toast.info('Sincronizando credenciales de tu dispositivo... vuelve a intentar en 3 segundos.');
          await subscribeToPushNotifications();
          return;
        }
        throw new Error(data.details || data.error || 'Error al enviar la prueba');
      }
      toast.success('Notificación de prueba enviada.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar la prueba');
    } finally {
      setIsTesting(false);
    }
  };

  if (isIOS && !isStandalone) {
    return (
      <div className="flex flex-col gap-3 border-b pb-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          <p className="text-sm font-medium">Notificaciones Push</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            No disponible en Safari iOS
          </div>
          <p className="mb-1.5">En iPhone/iPad las notificaciones push solo funcionan cuando instalás la app desde Safari.</p>
          <ol className="ml-3 list-decimal space-y-0.5">
            <li>Abrí esta página en Safari</li>
            <li>Tocá el botón Compartir <span className="font-mono">⬆</span></li>
            <li>Seleccioná &quot;Agregar a pantalla de inicio&quot;</li>
            <li>Abrí la app desde tu pantalla de inicio</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-b pb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <p className="text-sm font-medium">Notificaciones Push</p>
          </div>
          <p className="text-xs text-muted-foreground">Recibe alertas instantáneas en tu dispositivo.</p>
        </div>
        {isSubscribing ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <input 
            type="checkbox" 
            className="h-4 w-4 accent-primary cursor-pointer" 
            checked={permission === 'granted'}
            onChange={handleToggle}
          />
        )}
      </div>

      {permission === 'granted' && (
        <div className="flex justify-start">
          <button
            onClick={handleTestNotification}
            disabled={isTesting}
            className="flex items-center gap-2 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <BellRing className="h-3 w-3" />
            )}
            Enviar prueba a este dispositivo
          </button>
        </div>
      )}
    </div>
  );
}
