'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { isTaskFromActiveEntities } from '@/lib/tasks/active-entity';
import type { TaskFilters } from '@/types';

export function useActiveTasksQuery(filters?: TaskFilters) {
  const { user } = useAuth();
  const tasksQuery = useTasksQuery(filters);
  const projectsQuery = useProjectsQuery(user?.businessId ?? '');
  const locationsQuery = useLocationsQuery();

  const activeTasks = useMemo(() => {
    const projectsById = new Map(
      (projectsQuery.data ?? []).map((project) => [project.id, { status: project.status }]),
    );
    const locationsById = new Map(
      (locationsQuery.data ?? []).map((location) => [location.id, { status: location.status }]),
    );
    return (tasksQuery.data ?? []).filter((task) =>
      isTaskFromActiveEntities(task, projectsById, locationsById)
    );
  }, [tasksQuery.data, projectsQuery.data, locationsQuery.data]);

  return {
    ...tasksQuery,
    data: activeTasks,
    isLoading: tasksQuery.isLoading || projectsQuery.isLoading || locationsQuery.isLoading,
    isError: tasksQuery.isError || projectsQuery.isError || locationsQuery.isError,
    error: tasksQuery.error ?? projectsQuery.error ?? locationsQuery.error,
  };
}
