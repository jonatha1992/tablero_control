'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { subtasksApi } from '@/lib/api/subtasks';
import { subtaskKeys } from '@/hooks/queries/use-subtasks-query';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { Task } from '@/types/domain/task';

export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      subtasksApi.create(taskId, title),
    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey: subtaskKeys.byTask(taskId) });
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const previousSubtasks = queryClient.getQueryData<Task[]>(subtaskKeys.byTask(taskId));

      return { previousSubtasks };
    },
    onSuccess: () => {
      toast.success('Subtarea creada');
    },
    onError: (err, { taskId }, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(subtaskKeys.byTask(taskId), context.previousSubtasks);
      }
      toast.error('Error al crear subtarea', { description: (err as Error).message });
    },
    onSettled: (_data, _error, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: subtaskKeys.byTask(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
