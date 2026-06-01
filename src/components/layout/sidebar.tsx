'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  Building2,
  ScrollText,
  SlidersHorizontal,
  Layers,
  BarChart2,
  CalendarDays,
  LayoutGrid,
  Zap,
  Calendar,
  GanttChart,
  Timer,
  Target,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth-context';
import { useSpaceLabels } from '@/hooks/use-space-labels';
import { can } from '@/lib/permissions';
import { APP_VERSION, BUILD_DATE } from '@/config/version';

interface ChildItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  adminOnly?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  tourId?: string;
  exact?: boolean;
  children?: ChildItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tourId: 'tour-nav-dashboard', exact: true },
  {
    href: '/dashboard/tareas',
    label: 'Tareas',
    icon: CheckSquare,
    tourId: 'tour-nav-tareas',
    children: [
      { href: '/dashboard/tareas',            label: 'Kanban',      icon: LayoutGrid,  exact: true },
      { href: '/dashboard/tareas/agenda',     label: 'Agenda',      icon: Zap },
      { href: '/dashboard/tareas/calendario', label: 'Calendario',  icon: Calendar },
      { href: '/dashboard/tareas/cronograma', label: 'Cronograma',  icon: GanttChart },
      { href: '/dashboard/eventos',           label: 'Eventos',     icon: CalendarDays },
    ],
  },
  {
    href: '/dashboard/planificacion',
    label: 'Planificación',
    icon: Layers,
    tourId: 'tour-nav-planificacion',
    children: [
      { href: '/dashboard/planificacion',           label: 'Períodos',  icon: Timer, exact: true },
      { href: '/dashboard/planificacion/objetivos', label: 'Objetivos', icon: Target },
    ],
  },
  {
    href: '/dashboard/equipo',
    label: 'Equipo',
    icon: Users,
    tourId: 'tour-nav-equipo',
    children: [
      { href: '/dashboard/equipo',          label: 'Miembros',        icon: Users,       exact: true },
      { href: '/dashboard/equipo/sectores', label: '__SITES__', icon: Building2, adminOnly: true },
      { href: '/dashboard/equipo/roles',    label: 'Roles',           icon: ShieldCheck, adminOnly: true },
    ],
  },
  { href: '/dashboard/reportes',  label: 'Reportes',      icon: BarChart2,  tourId: 'tour-nav-reportes' },
  { href: '/dashboard/billing',   label: 'Facturación',   icon: CreditCard, tourId: 'tour-nav-billing' },
  { href: '/dashboard/config',    label: 'Configuración', icon: Settings,   tourId: 'tour-nav-config' },
  { href: '/dashboard/ayuda',     label: 'Ayuda',         icon: HelpCircle, tourId: 'tour-nav-ayuda' },
];

const superAdminItems = [
  { href: '/superadmin',               label: 'Plataforma',    icon: ShieldCheck,       exact: true },
  { href: '/superadmin/businesses',    label: 'Espacios',      icon: Building2,         exact: false },
  { href: '/superadmin/users',         label: 'Usuarios',      icon: Users,             exact: false },
  { href: '/superadmin/subscriptions', label: 'Suscripciones', icon: CreditCard,        exact: false },
  { href: '/superadmin/planes',        label: 'Planes',        icon: SlidersHorizontal, exact: false },
  { href: '/superadmin/audit',         label: 'Auditoría',     icon: ScrollText,        exact: false },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (val: boolean) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (val: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse, mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  const setMobileOpen = (val: boolean) => onMobileOpenChange?.(val);
  const pathname = usePathname();
  const { isSuperAdmin, user, isAdmin } = useAuth();
  const labels = useSpaceLabels();

  function isItemVisible(item: NavItem): boolean {
    if (!user) return false;
    switch (item.href) {
      case '/dashboard': return true;
      case '/dashboard/tareas': return can(user, 'task.read');
      case '/dashboard/planificacion': return can(user, 'task.create');
      case '/dashboard/equipo': return user.role === 'admin' || user.role === 'superadmin' || user.role === 'responsable';
      case '/dashboard/reportes': return can(user, 'business.reports.read');
      case '/dashboard/billing': return user.role === 'admin' || user.role === 'superadmin';
      case '/dashboard/config': return true;
      default: return true;
    }
  }

  function isChildVisible(child: ChildItem): boolean {
    if (child.adminOnly) return isAdmin;
    return true;
  }

  function isParentActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    // Parent is active if current path starts with it OR any child is active
    if (pathname.startsWith(item.href)) return true;
    return item.children?.some((c) =>
      c.exact ? pathname === c.href : pathname.startsWith(c.href)
    ) ?? false;
  }

  function isChildActive(child: ChildItem): boolean {
    return child.exact ? pathname === child.href : pathname.startsWith(child.href);
  }

  const visibleItems = navItems
    .filter(isItemVisible)
    .map((item) => ({
      ...item,
      children: item.children?.map((child) =>
        child.label === '__SITES__' ? { ...child, label: labels.sites } : child
      ),
    }));

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        'flex h-16 items-center border-b px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <Image src="/icon-cropped.png" alt="Tablero de Control" width={32} height={32} className="rounded-xl object-contain shrink-0" />
            <span className="font-bold text-lg whitespace-nowrap truncate">Tablero Control</span>
          </Link>
        )}
        {collapsed && (
          <Image src="/icon-cropped.png" alt="Tablero de Control" width={32} height={32} className="rounded-xl object-contain shrink-0" />
        )}
        <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => onCollapse(!collapsed)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const parentActive = isParentActive(item);
          const hasChildren = item.children && item.children.length > 0;
          const visibleChildren = item.children?.filter(isChildVisible) ?? [];

          return (
            <div key={item.href}>
              {/* Parent link */}
              <Link
                href={item.href}
                id={item.tourId}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  parentActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center',
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>

              {/* Children — only when expanded and parent active */}
              {!collapsed && hasChildren && parentActive && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-border space-y-0.5">
                  {visibleChildren.map((child) => {
                    const childActive = isChildActive(child);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                          childActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <child.icon className="h-3.5 w-3.5 shrink-0" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {isSuperAdmin && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className={cn('px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground', collapsed && 'text-center')}>
              {collapsed ? 'SA' : 'Administración'}
            </p>
            <div className="space-y-0.5">
              {superAdminItems.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      collapsed && 'justify-center',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4 text-xs text-muted-foreground">
          <p>v{APP_VERSION} · {BUILD_DATE}</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 hidden border-r bg-card lg:block transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-56'
      )}>
        {sidebarContent}
      </aside>
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-56 border-r bg-card lg:hidden">
          {sidebarContent}
        </aside>
      )}
    </>
  );
}
