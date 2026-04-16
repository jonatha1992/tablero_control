'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { taskKeys } from '@/hooks/queries/use-tasks-query';

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
