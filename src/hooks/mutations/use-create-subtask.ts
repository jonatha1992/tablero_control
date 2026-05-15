'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
<<<<<<< HEAD
import { toast } from 'sonner';
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
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
<<<<<<< HEAD
    onSuccess: () => {
      toast.success('Subtarea creada');
    },
    onError: (err, { taskId }, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(subtaskKeys.byTask(taskId), context.previousSubtasks);
      }
      toast.error('Error al crear subtarea', { description: (err as Error).message });
=======
    onError: (_err, { taskId }, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(subtaskKeys.byTask(taskId), context.previousSubtasks);
      }
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    },
    onSettled: (_data, _error, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: subtaskKeys.byTask(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
