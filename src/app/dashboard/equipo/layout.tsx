'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, ShieldCheck, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';

const TABS = [
  { href: '/dashboard/equipo', label: 'Miembros', icon: Users },
  { href: '/dashboard/equipo/sectores', label: 'Sectores', icon: Building2, adminOnly: true },
  { href: '/dashboard/equipo/roles', label: 'Roles y Permisos', icon: ShieldCheck, adminOnly: true },
];

export default function EquipoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-0" aria-label="Secciones del equipo">
          {visibleTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
