'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { UpdateTaskDTO } from '@/types/dto/task.dto';
import type { Task } from '@/types/domain/task';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDTO }) =>
      tasksApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      const previousDetail = queryClient.getQueryData<Task>(taskKeys.detail(id));

      // Actualizar todas las listas (Kanban, etc)
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === id ? { ...task, ...data } : task
        );
      });

      // Actualizar el detalle específico
      if (previousDetail) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousDetail,
          ...data,
        });
      }

      return { previousQueries, previousDetail };
    },
    onError: (err, { id }, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousDetail);
      }
    },
    onSettled: (_data, error, { id }) => {
      if (error) {
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      }
    },
  });
}
