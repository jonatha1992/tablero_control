'use client';

import { useQuery } from '@tanstack/react-query';
import type { Business } from '@/types/domain/business';

async function fetchBusiness(businessId: string): Promise<Business | null> {
  const res = await fetch('/api/business/config');
  if (!res.ok) return null;
  return res.json();
}

export function useBusinessQuery(businessId?: string) {
  return useQuery({
    queryKey: ['business', businessId],
    queryFn: () => fetchBusiness(businessId!),
    enabled: Boolean(businessId),
    staleTime: 1000 * 60 * 5,
  });
}
