'use client';

import { KanbanBoard } from '@/components/tareas/kanban-board';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';

export default function TareasPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();
  const { filters, setFilters } = useKanbanUIStore();

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">Tareas</h1>
          <p className="text-muted-foreground text-sm">Kanban con drag &amp; drop</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Cargando tareas...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Tareas</h1>
        <p className="text-muted-foreground text-sm">Kanban con drag &amp; drop</p>
      </div>
      <KanbanBoard tasks={tasks} />
    </div>
  );
}
