'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AgendaView } from '@/components/tareas/agenda-view';
import { CalendarSectionTabs } from '@/components/calendario/calendar-section-tabs';
import { TaskFilterBar } from '@/components/tareas/task-filter-bar';
import { useAuth } from '@/hooks/auth-context';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { isTaskFromActiveEntities } from '@/lib/tasks/active-entity';
import { useTaskFiltersUIStore } from '@/stores/task-filters-ui.store';
import { matchesTaskFilters } from '@/types/ui/task-filters.ui';

export default function AgendaPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { data: tasks = [], isLoading } = useTasksQuery();
  const { data: locations = [], isLoading: isLoadingLocations } = useLocationsQuery();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjectsQuery(user?.businessId ?? '');
  const filters = useTaskFiltersUIStore((s) => s.filters.agenda);
  const setFilter = useTaskFiltersUIStore((s) => s.setFilter);
  const clearFilters = useTaskFiltersUIStore((s) => s.clearFilters);

  useEffect(() => {
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');
    const patch: Parameters<typeof setFilter>[1] = {};
    if (locationId) patch.locationId = locationId;
    if (status === 'done') {
      // Show only finished work for this location (hide active statuses).
      patch.excludeStatuses = ['backlog', 'todo', 'in_progress', 'in_review', 'blocked'];
    }
    if (Object.keys(patch).length > 0) setFilter('agenda', patch);
  }, [searchParams, setFilter]);

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, { status: project.status }])),
    [projects],
  );
  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, { status: location.status }])),
    [locations],
  );

  const filteredTasks = useMemo(
    () => tasks.filter((task) =>
      matchesTaskFilters(task, filters) &&
      isTaskFromActiveEntities(task, projectsById, locationsById)),
    [tasks, filters, projectsById, locationsById]
  );

  if (isLoading || isLoadingProjects || isLoadingLocations) {
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
      <CalendarSectionTabs className="mb-4" />
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
