'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '@/lib/api/tasks';
import { ApiError } from '@/lib/api/errors';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import { taskUpdateErrorMessage } from '@/lib/task-update-access';
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

      // Actualizar solo caches de lista (Task[]). Keys `detail` son Task suelto — no mapear.
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((task) => {
          if (task.id === id) {
            const updated = { ...task, ...data } as Task;
            if (updated.locationId === null) updated.locationId = undefined;
            if (updated.projectId === null) updated.projectId = undefined;
            if (updated.cycleId === null) updated.cycleId = undefined;
            if (updated.objectiveId === null) updated.objectiveId = undefined;
            return updated;
          }
          return task;
        });
      });

      // Actualizar cualquier cache de "detalle" (incluye businessId en la key)
      queryClient.setQueriesData<Task>({ queryKey: [...taskKeys.all, 'detail'] }, (old) => {
        if (!old || Array.isArray(old) || old.id !== id) return old;
        const updatedDetail = { ...old, ...data } as Task;
        if (updatedDetail.locationId === null) updatedDetail.locationId = undefined;
        if (updatedDetail.projectId === null) updatedDetail.projectId = undefined;
        if (updatedDetail.cycleId === null) updatedDetail.cycleId = undefined;
        if (updatedDetail.objectiveId === null) updatedDetail.objectiveId = undefined;
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
      const reason = err instanceof ApiError ? err.message : undefined;
      toast.error('Error al actualizar tarea', {
        description: taskUpdateErrorMessage(reason) || (err as Error).message,
      });
    },
    onSuccess: (task) => {
      // Reemplazar el dato optimista por la respuesta real del servidor sin refetch.
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((t) => (t.id === task.id ? task : t));
      });
      queryClient.setQueriesData<Task>({ queryKey: [...taskKeys.all, 'detail'] }, (old) => {
        if (!old || Array.isArray(old) || old.id !== task.id) return old;
        return task;
      });
    },
  });
}
