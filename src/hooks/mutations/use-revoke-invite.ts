'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invitesApi } from '@/lib/api/invites';
import { inviteKeys } from '@/hooks/queries/use-invites-query';

export function useRevokeInvite(businessId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invitesApi.revoke(id),
    onSuccess: () => {
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: inviteKeys.byBusiness(businessId) });
      }
      toast.success('InvitaciÃ³n revocada');
    },
    onError: (err) => {
      toast.error('Error al revocar invitaciÃ³n', { description: (err as Error).message });
    },
  });
}
