'use client';

import { useQuery } from '@tanstack/react-query';
import { cyclesApi } from '@/lib/api/cycles';
import type { Cycle } from '@/types/domain/cycle';

export const cycleKeys = {
  all: ['cycles'] as const,
  byBusiness: (businessId: string) => [...cycleKeys.all, 'byBusiness', businessId] as const,
  detail: (id: string) => [...cycleKeys.all, 'detail', id] as const,
};

export function useCyclesQuery(businessId: string) {
  return useQuery({
    queryKey: cycleKeys.byBusiness(businessId),
    queryFn: async (): Promise<Cycle[]> => {
      if (!businessId) return [];
      try {
        return await cyclesApi.getByBusiness(businessId);
      } catch (e) {
        console.error('[useCyclesQuery] Error:', e);
        return [];
      }
    },
    enabled: !!businessId,
  });
}

export function useCycleQuery(id: string) {
  return useQuery({
    queryKey: cycleKeys.detail(id),
    queryFn: async (): Promise<Cycle | null> => {
      if (!id) return null;
      try {
        return await cyclesApi.getById(id);
      } catch (e) {
        console.error('[useCycleQuery] Error:', e);
        return null;
      }
    },
    enabled: !!id,
  });
}
