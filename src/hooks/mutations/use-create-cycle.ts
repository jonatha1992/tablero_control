'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
<<<<<<< HEAD
import { toast } from 'sonner';
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
import { cyclesApi } from '@/lib/api/cycles';
import { cycleKeys } from '@/hooks/queries/use-cycles-query';

export function useCreateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof cyclesApi.create>[0]) => cyclesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
<<<<<<< HEAD
      toast.success('Período creado');
    },
    onError: (err) => {
      toast.error('Error al crear período', { description: (err as Error).message });
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    },
  });
}
