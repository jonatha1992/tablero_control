'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { Task, TaskStatus } from '@/types/domain/task';

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) =>
      tasksApi.move(taskId, newStatus),
    onMutate: async ({ taskId, newStatus }) => {
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      const cancellation = queryClient.cancelQueries(
        { queryKey: taskKeys.all },
        { silent: true, revert: false }
      );

      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        );
      });

      await cancellation;
      return { previousQueries };
    },
    onError: (err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Error al mover tarea', { description: (err as Error).message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
