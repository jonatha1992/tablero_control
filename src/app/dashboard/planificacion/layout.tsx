'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Timer, Target } from 'lucide-react';

const TABS = [
  { href: '/dashboard/planificacion', label: 'Períodos', icon: Timer, exact: true },
  { href: '/dashboard/planificacion/objetivos', label: 'Objetivos', icon: Target, exact: false },
];

export default function PlanificacionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-0">
      <div className="border-b border-border mb-6">
        <nav className="flex gap-0" aria-label="Planificación">
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
