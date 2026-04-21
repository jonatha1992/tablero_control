'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { useAuth } from '@/hooks/auth-context';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { CreateTaskDTO } from '@/types/dto/task.dto';

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (dto: CreateTaskDTO) =>
      tasksApi.create(dto, user!.id, user!.businessId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
