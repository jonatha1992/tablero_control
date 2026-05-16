'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingApi } from '@/lib/api/billing';

export function useRecoverSubscription(businessId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.recoverSubscription(businessId ?? ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', businessId] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Suscripción reactivada');
    },
    onError: (err) => {
      toast.error('Error al reactivar suscripción', { description: (err as Error).message });
    },
  });
}
