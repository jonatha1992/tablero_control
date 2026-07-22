'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, LogOut, Menu, Download } from 'lucide-react';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials, stringToColor, ROLE_LABELS, ROLE_COLORS, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/auth-context';
import { NotificationBell } from '@/components/layout/notification-bell';
import { BusinessSwitcher } from '@/components/business-switcher';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useSpaceLabels } from '@/hooks/use-space-labels';
import { SEMANTIC_ICON } from '@/lib/constants/ui-icon-colors';

interface HeaderProps {
  userName?: string;
  onMobileMenuOpen?: () => void;
}

export function Header({ userName, onMobileMenuOpen }: HeaderProps) {
  const { user, signOut, role } = useAuth();
  const { canInstall, isInstalled, install } = usePwaInstall();
  const labels = useSpaceLabels();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, setFilters } = useKanbanUIStore();
  const isTasksPage = pathname?.startsWith('/dashboard/tareas');
  const showInstall = !isInstalled;

  const handleInstallClick = () => {
    if (canInstall) {
      void install();
      return;
    }
    // Sin beforeinstallprompt (Safari/iOS, Firefox, o PWA aún no instalable):
    // ir a Configuración donde están las instrucciones.
    router.push('/dashboard/config');
  };

  const displayName = userName || user?.name || 'Usuario';
  const initials = getInitials(displayName);
  const avatarColor = stringToColor(displayName);

  const roleLabels = ROLE_LABELS;
  const roleColors = ROLE_COLORS;

  const getPageContext = () => {
    if (!pathname) return { title: 'Tablero de Control' };
    if (pathname === '/dashboard') return { title: 'Dashboard' };
    if (pathname === '/dashboard/tareas/calendario') return { title: 'Calendario' };
    if (pathname === '/dashboard/eventos') return { title: 'Eventos' };
    if (pathname.startsWith('/dashboard/tareas')) return { title: 'Tareas' };
    if (pathname === '/dashboard/equipo') return { title: 'Equipo' };
    if (pathname === '/dashboard/equipo/roles') return { title: 'Roles y Permisos' };
    if (pathname === '/dashboard/equipo/sectores' || pathname === '/dashboard/sectores') {
      return { title: labels.sites };
    }
    if (pathname === '/dashboard/calendario') return { title: 'Calendario' };
    if (pathname === '/dashboard/ciclos') return { title: 'Ciclos' };
    if (pathname === '/dashboard/objetivos') return { title: 'Objetivos' };
    if (pathname === '/dashboard/planificacion') return { title: 'Planificación' };
    if (pathname === '/dashboard/planificacion/objetivos') return { title: 'Objetivos' };
    if (pathname === '/dashboard/cronograma') return { title: 'Cronograma' };
    if (pathname === '/dashboard/billing') return { title: 'Facturación' };
    if (pathname === '/dashboard/reportes') return { title: 'Reportes' };
    if (pathname === '/dashboard/ayuda') return { title: 'Ayuda' };
    if (pathname === '/dashboard/config/roles') return { title: 'Roles y Permisos' };
    if (pathname.startsWith('/dashboard/config')) {
      const tab = searchParams.get('tab');
      if (tab === 'facturacion') return { title: 'Facturación' };
      return { title: 'Configuración' };
    }
    if (pathname === '/superadmin') return { title: 'Plataforma' };
    if (pathname.startsWith('/superadmin/businesses')) return { title: 'Negocios' };
    if (pathname.startsWith('/superadmin/users')) return { title: 'Usuarios' };
    if (pathname.startsWith('/superadmin/subscriptions')) return { title: 'Suscripciones' };
    if (pathname.startsWith('/superadmin/planes')) return { title: 'Planes' };
    if (pathname.startsWith('/superadmin/audit')) return { title: 'Auditoría' };
    return { title: 'Tablero de Control' };
  };

  const { title } = getPageContext();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-card px-3 lg:px-6">
      {/* Mobile: hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={onMobileMenuOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Left: Title */}
      <div className="flex min-w-0 flex-1 items-center gap-4 lg:pl-0">
        {/* Desktop title (sidebar pushes via layout padding) */}
        <div className="hidden flex-col justify-center lg:flex">
          <h1 className="text-base font-semibold leading-none">{title}</h1>
        </div>

        {/* Mobile title */}
        <h1 className="truncate text-sm font-semibold lg:hidden">{title}</h1>

        {/* Search — tasks page */}
        {isTasksPage && (
          <div className="flex flex-1 items-center">
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
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {showInstall && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleInstallClick}
            title={canInstall ? 'Instalar aplicación' : 'Cómo instalar la aplicación'}
          >
            <Download className={cn('h-4 w-4', SEMANTIC_ICON.install)} />
          </Button>
        )}
        <NotificationBell />
        <BusinessSwitcher />

        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            {user?.avatar && <AvatarImage src={user.avatar} alt={displayName} />}
            <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden items-center gap-1.5 md:flex">
            <span className="text-sm font-medium">{displayName}</span>
            {role && (
              <Badge className={`${roleColors[role]} h-5 px-1.5 text-[10px]`}>
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
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
