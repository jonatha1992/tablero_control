'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
<<<<<<< HEAD
import { toast } from 'sonner';
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
import { invitesApi } from '@/lib/api/invites';
import { memberKeys } from '@/hooks/queries/use-members-query';

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => invitesApi.accept(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
<<<<<<< HEAD
      toast.success('Invitación aceptada');
    },
    onError: (err) => {
      toast.error('Error al aceptar invitación', { description: (err as Error).message });
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    },
  });
}
