'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, BellOff, Loader2, ClipboardList } from 'lucide-react';
import { useNotificationsQuery, useMarkAllReadMutation, useMarkOneReadMutation } from '@/hooks/queries/use-notifications-query';
import type { AppNotification } from '@/hooks/queries/use-notifications-query';
import { useAuth } from '@/hooks/auth-context';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (!notification.read) onRead(notification.id);
    if (notification.link) router.push(notification.link);
  };

  const typeIcon: Record<string, string> = {
    task_assigned: '📋',
    task_updated: '✏️',
    mention: '💬',
    info: '🔔',
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left flex gap-3 px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0',
        !notification.read && 'bg-primary/5'
      )}
    >
      <span className="text-lg shrink-0 mt-0.5">{typeIcon[notification.type] ?? '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !notification.read && 'font-semibold')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
        </p>
      </div>
      {!notification.read && (
        <span className="mt-1.5 shrink-0 h-2 w-2 rounded-full bg-primary" />
      )}
    </button>
  );
}

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotificationsQuery();
  const markAll = useMarkAllReadMutation();
  const markOne = useMarkOneReadMutation();

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      {/* Botón campanita */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border bg-card shadow-xl ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header del panel */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {markAll.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <BellOff className="h-8 w-8 opacity-40" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={(id) => markOne.mutate(id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2.5 flex justify-center">
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ClipboardList className="h-3 w-3" />
                Ver solo en el tablero
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
