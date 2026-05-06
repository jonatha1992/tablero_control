'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Calendar, GanttChart, Zap } from 'lucide-react';

const TABS = [
  { href: '/dashboard/tareas', label: 'Kanban', icon: LayoutGrid, exact: true },
  { href: '/dashboard/tareas/agenda', label: 'Agenda', icon: Zap, exact: false },
  { href: '/dashboard/tareas/calendario', label: 'Calendario', icon: Calendar, exact: false },
  { href: '/dashboard/tareas/cronograma', label: 'Cronograma', icon: GanttChart, exact: false },
];

export default function TareasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-0">
      <div className="border-b border-border mb-6">
        <nav className="flex gap-0" aria-label="Vistas de tareas">
          {TABS.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
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
      {children}
    </div>
  );
}
