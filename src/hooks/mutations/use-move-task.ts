'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { Task, TaskStatus } from '@/types/domain/task';

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) =>
      tasksApi.move(taskId, newStatus),
    // Optimistic Update
    onMutate: async ({ taskId, newStatus }) => {
      // Cancelar con await para que la actualización optimista se aplique sin conflictos con fetch en vuelo
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Guardar el estado previo de todas las queries relacionadas
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });

      // Actualizar TODAS las queries de tareas instantáneamente
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        );
      });

      return { previousQueries };
    },
    // Si la mutación falla, restauramos cada query a su estado anterior
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // Siempre invalidar al final para sincronizar con el servidor real
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
