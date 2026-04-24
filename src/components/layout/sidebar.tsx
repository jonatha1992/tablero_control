'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  CreditCard,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/sectores', label: 'Departamentos', icon: Building2 },
  { href: '/dashboard/tareas', label: 'Tareas', icon: CheckSquare },
  { href: '/dashboard/calendario', label: 'Calendario', icon: Calendar },
  { href: '/dashboard/equipo', label: 'Equipo', icon: Users },
  { href: '/dashboard/billing', label: 'Facturación', icon: CreditCard },
  { href: '/dashboard/config', label: 'Configuración', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (val: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        'flex h-16 items-center border-b px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="TecnoFusión Logo" width={40} height={40} className="object-contain mix-blend-multiply dark:invert dark:mix-blend-screen" />
            <span className="font-semibold text-lg">Tablero Control</span>
          </Link>
        )}
        {collapsed && (
          <Image src="/logo.png" alt="TecnoFusión Logo" width={40} height={40} className="object-contain mix-blend-multiply dark:invert dark:mix-blend-screen" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => onCollapse(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          // Dashboard exact match; all others activate on prefix
          const isActive =
            item.href === '/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {isSuperAdmin && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className={cn("px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground", collapsed && "text-center")}>
              {collapsed ? 'SA' : 'Administración'}
            </p>
            <div className="space-y-1">
              <Link
                href="/superadmin"
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === '/superadmin'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? 'Panel Global' : undefined}
              >
                <ShieldCheck className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Panel Global</span>}
              </Link>
              <Link
                href="/superadmin/businesses"
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith('/superadmin/businesses')
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? 'Negocios' : undefined}
              >
                <Building2 className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Negocios</span>}
              </Link>
              <Link
                href="/superadmin/users"
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === '/superadmin/users'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? 'Usuarios Globales' : undefined}
              >
                <Users className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Usuarios Globales</span>}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4 text-xs text-muted-foreground">
          <p>v0.1.0 · En desarrollo</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 hidden border-r bg-card lg:block transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-56'
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-56 border-r bg-card lg:hidden">
          {sidebarContent}
        </aside>
      )}
    </>
  );
}
