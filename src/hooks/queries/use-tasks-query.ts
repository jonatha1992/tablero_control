'use client';

import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { useAuth } from '@/hooks/auth-context';
import type { Task, TaskFilters } from '@/types/domain/task';

export const taskKeys = {
  all: ['tasks'] as const,
  byBusiness: (key: string, filters?: TaskFilters) =>
    [...taskKeys.all, 'byBusiness', key, filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

export function useTasksQuery(filters?: TaskFilters) {
  const { user, isSuperAdmin } = useAuth();

  // superadmin ve tareas de su propio negocio como cualquier usuario
  const businessId = user?.businessId ?? null;
  const queryKey = businessId ?? `creator:${user?.id}`;

  return useQuery({
    queryKey: taskKeys.byBusiness(queryKey, filters),
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];
      try {
        if (businessId) {
          return await tasksApi.getByBusiness(businessId, filters);
        }
        // Fallback: el usuario no tiene businessId, mostrar las tareas que creó
        return await tasksApi.getByCreator(user.id, filters);
      } catch (e) {
        console.error('[useTasksQuery] Error al obtener tareas:', e);
        return [];
      }
    },
    enabled: !!user,
  });
}

export function useTaskQuery(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  });
}
