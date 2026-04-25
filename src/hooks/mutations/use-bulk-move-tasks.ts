'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { Task, TaskStatus } from '@/types/domain/task';

export function useBulkMoveTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskIds, newStatus }: { taskIds: string[]; newStatus: TaskStatus }) =>
      Promise.all(taskIds.map((id) => tasksApi.move(id, newStatus))),
    onMutate: async ({ taskIds, newStatus }) => {
      queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          taskIds.includes(task.id) ? { ...task, status: newStatus } : task
        );
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
