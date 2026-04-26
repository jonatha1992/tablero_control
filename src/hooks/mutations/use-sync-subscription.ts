'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';

export function useSyncSubscription(businessId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.syncSubscription(businessId ?? ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', businessId] });
    },
  });
}
