'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { objectivesApi } from '@/lib/api/objectives';
import { objectiveKeys } from '@/hooks/queries/use-objectives-query';

export function useCreateObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof objectivesApi.create>[0]) => objectivesApi.create(data),
    onSuccess: (obj) => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      toast.success('Objetivo creado', { description: obj.name });
    },
    onError: (err: Error) => {
      toast.error('Error al crear el objetivo', { description: err.message });
    },
  });
}
