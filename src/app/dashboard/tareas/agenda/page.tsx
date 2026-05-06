'use client';

import { AgendaView } from '@/components/tareas/agenda-view';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';

export default function AgendaPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando agenda…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
      <AgendaView tasks={tasks} />
    </div>
  );
}
