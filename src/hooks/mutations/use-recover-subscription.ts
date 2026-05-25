'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingApi } from '@/lib/api/billing';

export function useRecoverSubscription(businessId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.recoverSubscription(businessId ?? ''),
    onSuccess: (data) => {
      if (data.recovered > 0 || data.preapprovalActivated) {
        qc.invalidateQueries({ queryKey: ['subscription', businessId] });
        qc.invalidateQueries({ queryKey: ['invoices', businessId] });
        toast.success('Pago verificado correctamente');
      } else if (data.initPoint) {
        toast.info('Completá el pago en Mercado Pago');
      }
    },
    onError: (err) => {
      toast.error('Error al reactivar suscripción', { description: (err as Error).message });
    },
  });
}
