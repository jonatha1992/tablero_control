'use client';

import { useQuery } from '@tanstack/react-query';
import { auth } from '@/lib/firebase/client';
import type { Subscription } from '@/types/domain/subscription';

async function fetchSubscription(_businessId: string): Promise<Subscription | null> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/business/subscription', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json() as Promise<Subscription | null>;
}

export function useSubscriptionQuery(businessId?: string) {
  return useQuery({
    queryKey: ['subscription', businessId],
    queryFn: () => fetchSubscription(businessId!),
    enabled: Boolean(businessId),
    staleTime: 1000 * 60 * 5,
  });
}
