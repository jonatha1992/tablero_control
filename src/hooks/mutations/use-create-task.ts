'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { useAuth } from '@/hooks/auth-context';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { CreateTaskDTO } from '@/types/dto/task.dto';
import type { Task } from '@/types/domain/task';
import { toast } from 'sonner';

export type CreateTaskInput = CreateTaskDTO & { projectIds?: string[] };

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTaskInput): Promise<Task | Task[]> => {
      const { projectIds, ...dto } = input;
      const businessId = user?.businessId ?? '';
      const creatorId = user!.id;
      if (projectIds && projectIds.length > 1) {
        const { tasks } = await tasksApi.replicate({ projectIds, template: dto });
        return tasks;
      }
      const projectId = projectIds?.[0] ?? dto.projectId;
      return tasksApi.create({ ...dto, projectId }, creatorId, businessId);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      const tasks = Array.isArray(result) ? result : [result];
      const n = tasks.length;
      const boards = new Set(tasks.map((t) => t.projectId).filter(Boolean)).size;
      toast.success(
        n > 1
          ? `${n} tareas creadas${boards > 1 ? ` en ${boards} tableros` : ''}`
          : 'Tarea creada',
        { description: tasks[0]?.title },
      );
    },
    onError: (err: Error) => {
      toast.error('Error al crear la tarea', {
        description: err.message,
      });
    },
  });
}
