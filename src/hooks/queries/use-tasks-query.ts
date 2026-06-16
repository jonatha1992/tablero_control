'use client';

import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { useAuth } from '@/hooks/auth-context';
import type { Task, TaskFilters } from '@/types/domain/task';

export const taskKeys = {
  all: ['tasks'] as const,
  byBusiness: (key: string, filters?: TaskFilters) =>
    [...taskKeys.all, 'byBusiness', key, filters] as const,
  detail: (businessId: string | null | undefined, id: string) =>
    [...taskKeys.all, 'detail', businessId ?? 'no-business', id] as const,
};

export function useTasksQuery(filters?: TaskFilters) {
  const { user, isSuperAdmin } = useAuth();

  const businessId = isSuperAdmin
    ? (user?.businessId ?? 'all')
    : (user?.businessId ?? null);
  const queryKey = businessId ?? `creator:${user?.id}`;

  return useQuery({
    queryKey: taskKeys.byBusiness(queryKey, filters),
    queryFn: async ({ signal }): Promise<Task[]> => {
      if (!user) return [];
      if (businessId) {
        return filters
          ? tasksApi.getByBusiness(businessId, signal, filters)
          : tasksApi.getByBusiness(businessId, signal);
      }
      return filters
        ? tasksApi.getByCreator(user.id, signal, filters)
        : tasksApi.getByCreator(user.id, signal);
    },
    enabled: !!user,
  });
}

export function useTaskQuery(id: string) {
  const { user } = useAuth();
  const businessId = user?.businessId ?? null;
  return useQuery({
    queryKey: taskKeys.detail(businessId, id),
    queryFn: ({ signal }) => tasksApi.getById(id, signal),
    enabled: !!id && !!user,
  });
}
