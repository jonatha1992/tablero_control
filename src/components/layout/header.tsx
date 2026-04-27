'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, LogOut } from 'lucide-react';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials, stringToColor, ROLE_LABELS, ROLE_COLORS } from '@/lib/utils';
import { useAuth } from '@/hooks/auth-context';

interface HeaderProps {
  userName?: string;
  notificationCount?: number;
}

export function Header({ userName, notificationCount = 0 }: HeaderProps) {
  const { user, signOut, role } = useAuth();
  const pathname = usePathname();
  const { filters, setFilters } = useKanbanUIStore();
  const isTasksPage = pathname?.startsWith('/dashboard/tareas');
  
  const displayName = userName || user?.name || 'Usuario';
  const initials = getInitials(displayName);
  const avatarColor = stringToColor(displayName);

  const roleLabels = ROLE_LABELS;
  const roleColors = ROLE_COLORS;

  const getPageContext = () => {
    if (!pathname) return { title: 'Tablero de Control', description: '' };
    if (pathname === '/dashboard') return { title: 'Dashboard de Negocio', description: 'Resumen global de rendimiento y métricas operativas.' };
    if (pathname === '/dashboard/sectores') return { title: 'Departamentos y Sectores', description: 'Gestioná la estructura organizativa de tu negocio.' };
    if (pathname.startsWith('/dashboard/tareas')) return { title: 'Tareas', description: 'Kanban con drag & drop' };
    if (pathname === '/dashboard/equipo') return { title: 'Equipo', description: 'Miembros del equipo.' };
    if (pathname === '/dashboard/equipo/roles') return { title: 'Roles y Permisos', description: 'Administración de accesos y permisos del equipo.' };
    if (pathname.startsWith('/dashboard/config')) return { title: 'Configuración', description: 'Ajustes de la plataforma' };
    if (pathname === '/dashboard/calendario') return { title: 'Calendario', description: 'Cronograma de tareas' };
    if (pathname === '/dashboard/billing') return { title: 'Facturación', description: 'Suscripción y pagos' };
    return { title: 'Tablero de Control', description: '' };
  };

  const { title, description } = getPageContext();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
      {/* Left: Title */}
      <div className="hidden items-center gap-4 lg:flex lg:pl-16">
        <div className="flex flex-col justify-center">
          <h1 className="text-base font-semibold leading-none">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 leading-none">{description}</p>
          )}
        </div>
      </div>

      {/* Center: Search */}
      {isTasksPage && (
        <div className="flex flex-1 items-center gap-4 px-4 lg:px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {notificationCount}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            {user?.avatar && <AvatarImage src={user.avatar} alt={displayName} />}
            <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-sm font-medium">{displayName}</span>
            {role && (
              <Badge className={`${roleColors[role]} h-5 text-[10px] px-1.5`}>
                {roleLabels[role]}
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
