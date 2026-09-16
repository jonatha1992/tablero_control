'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, List, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateEventModal } from '@/components/tareas/create-event-modal';
import { cn } from '@/lib/utils';

/** Vistas del Calendario: una sola sección en el menú, tres pestañas. */
export const CALENDAR_SECTION_TABS = [
  { href: '/dashboard/tareas/calendario', label: 'Mes', icon: CalendarDays },
  { href: '/dashboard/tareas/agenda', label: 'Agenda', icon: Zap },
  { href: '/dashboard/eventos', label: 'Eventos', icon: List },
] as const;

export function CalendarSectionTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const [eventModalOpen, setEventModalOpen] = useState(false);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 border-b', className)}>
      <nav aria-label="Vistas del calendario" className="flex items-center gap-1">
        {CALENDAR_SECTION_TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 pb-2 pt-1 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <Button size="sm" variant="outline" className="mb-1.5" onClick={() => setEventModalOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Nuevo evento
      </Button>
      <CreateEventModal open={eventModalOpen} onOpenChange={setEventModalOpen} />
    </div>
  );
}
