'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
<<<<<<< HEAD
import { toast } from 'sonner';
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
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
<<<<<<< HEAD
      toast.success('Invitación revocada');
    },
    onError: (err) => {
      toast.error('Error al revocar invitación', { description: (err as Error).message });
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    },
  });
}
