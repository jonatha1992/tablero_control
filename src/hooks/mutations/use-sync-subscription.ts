'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingApi } from '@/lib/api/billing';

export function useSyncSubscription(businessId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.syncSubscription(businessId ?? ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', businessId] });
      toast.success('Suscripción sincronizada');
    },
    onError: (err) => {
      toast.error('Error al sincronizar suscripción', { description: (err as Error).message });
    },
  });
}
