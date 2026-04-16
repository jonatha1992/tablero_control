'use client';

import { CalendarView } from '@/components/calendario/calendar-view';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';

export default function CalendarioPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();
  const updateTask = useUpdateTask();

  const handleEventDrop = (taskId: string, newDate: Date) => {
    updateTask.mutate({ id: taskId, data: { dueDate: newDate } });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full gap-4">
      <div className="shrink-0">
        <h1 className="text-xl font-bold">Calendario</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Vista mensual y semanal de entregables (Arrastra para reprogramar)
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Cargando calendario...
          </div>
        ) : (
          <CalendarView tasks={tasks} onEventDrop={handleEventDrop} />
        )}
      </div>
    </div>
  );
}
