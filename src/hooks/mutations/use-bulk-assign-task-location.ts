'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import { toast } from 'sonner';
import type { Task } from '@/types/domain/task';

export function useBulkAssignTaskLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskIds, locationId }: { taskIds: string[]; locationId: string | null }) =>
      Promise.all(taskIds.map((id) => tasksApi.update(id, { locationId }))),
    onMutate: async ({ taskIds, locationId }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          taskIds.includes(task.id) ? { ...task, locationId: locationId ?? undefined } : task
        );
      });
      return { previousQueries };
    },
    onSuccess: (_data, { taskIds }) => {
      toast.success(`${taskIds.length} tarea${taskIds.length !== 1 ? 's' : ''} asignada${taskIds.length !== 1 ? 's' : ''} al sector`);
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('Error al asignar sector');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
