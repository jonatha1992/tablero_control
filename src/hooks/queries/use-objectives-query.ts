'use client';

import { useQuery } from '@tanstack/react-query';
import { objectivesApi } from '@/lib/api/objectives';
import type { Objective } from '@/types/domain/objective';

export const objectiveKeys = {
  all: ['objectives'] as const,
  byBusiness: (businessId: string) => [...objectiveKeys.all, 'byBusiness', businessId] as const,
  detail: (id: string) => [...objectiveKeys.all, 'detail', id] as const,
};

export function useObjectivesQuery(businessId: string) {
  return useQuery({
    queryKey: objectiveKeys.byBusiness(businessId),
    queryFn: async (): Promise<Objective[]> => {
      if (!businessId) return [];
      try {
        return await objectivesApi.getByBusiness(businessId);
      } catch (e) {
        console.error('[useObjectivesQuery] Error:', e);
        return [];
      }
    },
    enabled: !!businessId,
  });
}

export function useObjectiveQuery(id: string) {
  return useQuery({
    queryKey: objectiveKeys.detail(id),
    queryFn: async (): Promise<Objective | null> => {
      if (!id) return null;
      try {
        return await objectivesApi.getById(id);
      } catch (e) {
        console.error('[useObjectiveQuery] Error:', e);
        return null;
      }
    },
    enabled: !!id,
  });
}
