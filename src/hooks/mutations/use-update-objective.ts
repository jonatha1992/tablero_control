'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { objectivesApi } from '@/lib/api/objectives';
import { objectiveKeys } from '@/hooks/queries/use-objectives-query';

export function useUpdateObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof objectivesApi.update>[1] }) =>
      objectivesApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      queryClient.invalidateQueries({ queryKey: objectiveKeys.detail(id) });
    },
  });
}

export function useDeleteObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => objectivesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
    },
  });
}

export function useCompleteObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => objectivesApi.complete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      queryClient.invalidateQueries({ queryKey: objectiveKeys.detail(id) });
    },
  });
}

export function useArchiveObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => objectivesApi.archive(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      queryClient.invalidateQueries({ queryKey: objectiveKeys.detail(id) });
    },
  });
}
