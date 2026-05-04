'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { objectivesApi } from '@/lib/api/objectives';
import { objectiveKeys } from '@/hooks/queries/use-objectives-query';

export function useCreateObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof objectivesApi.create>[0]) => objectivesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
    },
  });
}
