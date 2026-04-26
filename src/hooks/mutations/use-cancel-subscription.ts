'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';

export function useCancelSubscription(businessId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) => billingApi.cancelSubscription(subscriptionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', businessId] });
    },
  });
}
