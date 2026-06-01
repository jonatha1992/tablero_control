'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
      await queryClient.cancelQueries({ queryKey: [...taskKeys.all, 'detail'] });

      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      const previousDetails = queryClient.getQueriesData<Task>({ queryKey: [...taskKeys.all, 'detail'] });

      // Actualizar todas las listas (Kanban, etc)
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) => {
          if (task.id === id) {
            const updated = { ...task, ...data } as Task;
            if (updated.locationId === null) updated.locationId = undefined;
            if (updated.projectId === null) updated.projectId = undefined;
            return updated;
          }
          return task;
        });
      });

      // Actualizar cualquier cache de "detalle" (incluye businessId en la key)
      queryClient.setQueriesData<Task>({ queryKey: [...taskKeys.all, 'detail'] }, (old) => {
        if (!old || old.id !== id) return old;
        const updatedDetail = { ...old, ...data } as Task;
        if (updatedDetail.locationId === null) updatedDetail.locationId = undefined;
        if (updatedDetail.projectId === null) updatedDetail.projectId = undefined;
        return updatedDetail;
      });

      return { previousQueries, previousDetails };
    },
    onError: (err, { id: _id }, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDetails) {
        context.previousDetails.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Error al actualizar tarea', { description: (err as Error).message });
    },
    onSettled: (_data, _error, { id: _id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      // Detail keys are tenant-scoped; invalidate them all to avoid missing the active one.
      queryClient.invalidateQueries({ queryKey: [...taskKeys.all, 'detail'] });
    },
  });
}
