'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { UpdateTaskDTO } from '@/types/dto/task.dto';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDTO }) =>
      taskService.updateTask(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}
