'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import { TASK_STATUS_LABELS } from '@/lib/constants/task';
import type { Task, TaskStatus } from '@/types/domain/task';

export function useBulkMoveTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskIds, newStatus }: { taskIds: string[]; newStatus: TaskStatus }) =>
      Promise.all(taskIds.map((id) => tasksApi.move(id, newStatus))),
    onMutate: async ({ taskIds, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          taskIds.includes(task.id) ? { ...task, status: newStatus } : task
        );
      });
      return { previousQueries };
    },
    onSuccess: (_data, { taskIds, newStatus }) => {
      const n = taskIds.length;
      toast.success(`${n} tarea${n !== 1 ? 's' : ''} movida${n !== 1 ? 's' : ''} a ${TASK_STATUS_LABELS[newStatus]}`);
    },
    onError: (err, _vars, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('Error al mover tareas', { description: (err as Error).message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
