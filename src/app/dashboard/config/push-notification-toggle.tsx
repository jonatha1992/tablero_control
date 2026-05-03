'use client';

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export function PushNotificationToggle() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;

    if (!('Notification' in window)) {
      e.preventDefault();
      toast.error('Tu navegador no soporta notificaciones push.');
      return;
    }

    if (isChecked) {
      if (permission === 'granted') return;
      
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        
        if (result === 'granted') {
          toast.success('Notificaciones activadas correctamente.');
          // TODO: Opcional - Registrar el service worker para FCM aquí
        } else {
          toast.error('Permiso denegado para las notificaciones.');
          e.target.checked = false;
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast.error('Ocurrió un error al intentar activar las notificaciones.');
        e.target.checked = false;
      }
    } else {
      // Browser permissions can't be easily revoked via JS, but we can update user preference in DB
      toast.info('Para desactivar completamente, debes revocar el permiso desde el ícono del candado en la barra de tu navegador.');
      setPermission('default');
    }
  };

  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div>
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" /> 
          <p className="text-sm font-medium">Notificaciones Push</p>
        </div>
        <p className="text-xs text-muted-foreground">Notificaciones en el navegador y vista móvil al instante.</p>
      </div>
      <input 
        type="checkbox" 
        className="h-4 w-4 accent-primary" 
        checked={permission === 'granted'}
        onChange={handleToggle}
      />
    </div>
  );
}
