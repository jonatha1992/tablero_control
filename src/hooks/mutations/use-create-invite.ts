'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
<<<<<<< HEAD
import { toast } from 'sonner';
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
import { invitesApi, type CreateInviteInput } from '@/lib/api/invites';
import { inviteKeys } from '@/hooks/queries/use-invites-query';

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInviteInput) => invitesApi.create(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: inviteKeys.byBusiness(variables.businessId) });
<<<<<<< HEAD
      toast.success('Link de invitación creado');
    },
    onError: (err) => {
      toast.error('Error al crear invitación', { description: (err as Error).message });
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    },
  });
}
