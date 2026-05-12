'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingApi } from '@/lib/api/billing';

export function useCancelSubscription(businessId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) => billingApi.cancelSubscription(subscriptionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', businessId] });
      toast.success('Suscripción cancelada');
    },
    onError: (err) => {
      toast.error('Error al cancelar suscripción', { description: (err as Error).message });
    },
  });
}
