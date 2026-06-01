'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '@/lib/api/tasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { CreateTaskDTO } from '@/types/dto/task.dto';

export function useReplicateTaskToProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      projectIds: string[];
      template?: CreateTaskDTO;
      sourceTaskId?: string;
    }) => tasksApi.replicate(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      const n = data.count;
      const boards = new Set(data.tasks.map((t) => t.projectId).filter(Boolean)).size;
      toast.success(
        `${n} copia${n !== 1 ? 's' : ''} creada${n !== 1 ? 's' : ''}${boards > 1 ? ` en ${boards} tableros` : ''}`,
        { description: data.tasks[0]?.title },
      );
    },
    onError: (err: Error) => {
      toast.error('Error al duplicar la tarea', { description: err.message });
    },
  });
}
