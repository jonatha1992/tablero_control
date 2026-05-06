'use client';

import { GanttView } from '@/components/tareas/gantt-view';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';

export default function CronogramaPage() {
  const { data: tasks = [], isLoading, isError, error } = useTasksQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando cronograma...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-destructive">Error al cargar el cronograma</p>
            <p className="text-xs text-muted-foreground">{(error as Error)?.message ?? 'Error desconocido'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      <GanttView tasks={tasks} />
    </div>
  );
}
