'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cyclesApi } from '@/lib/api/cycles';
import { cycleKeys } from '@/hooks/queries/use-cycles-query';

export function useCreateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof cyclesApi.create>[0]) => cyclesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      toast.success('Período creado');
    },
    onError: (err) => {
      toast.error('Error al crear período', { description: (err as Error).message });
    },
  });
}
