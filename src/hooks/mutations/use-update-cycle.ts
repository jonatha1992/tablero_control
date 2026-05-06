'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cyclesApi } from '@/lib/api/cycles';
import { cycleKeys } from '@/hooks/queries/use-cycles-query';

export function useUpdateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof cyclesApi.update>[1] }) =>
      cyclesApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      queryClient.invalidateQueries({ queryKey: cycleKeys.detail(id) });
    },
  });
}

export function useDeleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cyclesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
    },
  });
}

export function useStartCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cyclesApi.start(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      queryClient.invalidateQueries({ queryKey: cycleKeys.detail(id) });
    },
  });
}

export function useCompleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cyclesApi.complete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      queryClient.invalidateQueries({ queryKey: cycleKeys.detail(id) });
    },
  });
}
