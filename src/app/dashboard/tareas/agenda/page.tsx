'use client';

import { useMemo } from 'react';
import { AgendaView } from '@/components/tareas/agenda-view';
import { TaskFilterBar } from '@/components/tareas/task-filter-bar';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useTaskFiltersUIStore } from '@/stores/task-filters-ui.store';
import { matchesTaskFilters } from '@/types/ui/task-filters.ui';

export default function AgendaPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();
  const filters = useTaskFiltersUIStore((s) => s.filters.agenda);
  const setFilter = useTaskFiltersUIStore((s) => s.setFilter);
  const clearFilters = useTaskFiltersUIStore((s) => s.clearFilters);

  const filteredTasks = useMemo(
    () => tasks.filter((t) => matchesTaskFilters(t, filters)),
    [tasks, filters]
  );

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
      <div className="mb-4">
        <TaskFilterBar
          filters={filters}
          onChange={(patch) => setFilter('agenda', patch)}
          onClear={() => clearFilters('agenda')}
        />
      </div>
      <AgendaView tasks={filteredTasks} />
    </div>
  );
}
