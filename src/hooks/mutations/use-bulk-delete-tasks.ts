'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { Task } from '@/types/domain/task';

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskIds }: { taskIds: string[] }) =>
      Promise.all(taskIds.map((id) => tasksApi.delete(id))),
    onMutate: async ({ taskIds }) => {
      queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.filter((task) => !taskIds.includes(task.id));
      });
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
