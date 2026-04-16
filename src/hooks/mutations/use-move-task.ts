'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { TaskStatus } from '@/types/domain/task';

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) =>
      taskService.moveTask(taskId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
