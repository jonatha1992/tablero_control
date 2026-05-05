'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cyclesApi } from '@/lib/api/cycles';
import { cycleKeys } from '@/hooks/queries/use-cycles-query';

export function useCreateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof cyclesApi.create>[0]) => cyclesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
    },
  });
}
