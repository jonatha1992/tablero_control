'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invitesApi } from '@/lib/api/invites';

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => invitesApi.accept(token),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Invitación aceptada');
    },
    onError: (err) => {
      toast.error('Error al aceptar invitación', { description: (err as Error).message });
    },
  });
}
