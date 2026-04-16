'use client';

import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { useAuth } from '@/hooks/auth-context';
import type { TaskFilters } from '@/types/domain/task';

export const taskKeys = {
  all: ['tasks'] as const,
  byBusiness: (businessId: string, filters?: TaskFilters) =>
    [...taskKeys.all, 'byBusiness', businessId, filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

export function useTasksQuery(filters?: TaskFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: taskKeys.byBusiness(user?.businessId ?? '', filters),
    queryFn: () => taskService.getTasksByBusiness(user!.businessId!, filters),
    enabled: !!user?.businessId,
  });
}

export function useTaskQuery(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskService.getTaskById(id),
    enabled: !!id,
  });
}
