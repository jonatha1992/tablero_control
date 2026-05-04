'use client';

import { useQuery } from '@tanstack/react-query';
import { subtasksApi } from '@/lib/api/subtasks';
import type { Task } from '@/types/domain/task';

export const subtaskKeys = {
  all: ['subtasks'] as const,
  byTask: (taskId: string) => [...subtaskKeys.all, 'byTask', taskId] as const,
};

export function useSubtasksQuery(taskId: string) {
  return useQuery({
    queryKey: subtaskKeys.byTask(taskId),
    queryFn: async (): Promise<Task[]> => {
      if (!taskId) return [];
      try {
        return await subtasksApi.getByTask(taskId);
      } catch (e) {
        console.error('[useSubtasksQuery] Error:', e);
        return [];
      }
    },
    enabled: !!taskId,
  });
}
