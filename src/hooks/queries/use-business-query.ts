'use client';

import { useQuery } from '@tanstack/react-query';
import { getToken } from '@/lib/firebase/auth';
import type { Business } from '@/types/domain/business';

async function fetchBusiness(businessId: string): Promise<Business | null> {
  const token = await getToken();
  const res = await fetch('/api/business/config', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
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
