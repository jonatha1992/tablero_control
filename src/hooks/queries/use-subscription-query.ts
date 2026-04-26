'use client';

import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';

export function useSubscriptionQuery(businessId?: string) {
  return useQuery({
    queryKey: ['subscription', businessId],
    queryFn: () => billingApi.getSubscription(),
    enabled: Boolean(businessId),
    staleTime: 1000 * 60 * 5,
  });
}
