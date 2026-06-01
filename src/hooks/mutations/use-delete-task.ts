'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import { toast } from 'sonner';
import type { Task } from '@/types/domain/task';
import { ApiError } from '@/lib/api/errors';

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.filter((task) => task.id !== id);
      });
      
      return { previousQueries };
    },
    onSuccess: () => {
      toast.success('Tarea eliminada');
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      const description =
        err instanceof ApiError && err.status === 403
          ? 'No tenés permisos para eliminar esta tarea.'
          : err.message;
      toast.error('Error al eliminar la tarea', { description });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
