'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invitesApi, type CreateInviteInput } from '@/lib/api/invites';
import { inviteKeys } from '@/hooks/queries/use-invites-query';
import { memberKeys } from '@/hooks/queries/use-members-query';

export type InviteUserInput = CreateInviteInput;

export type InviteUserResult = Awaited<ReturnType<typeof invitesApi.create>> & {
  emailSent?: boolean;
};

async function inviteUserViaApi(input: InviteUserInput): Promise<InviteUserResult> {
  return invitesApi.create(input);
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteUserViaApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      queryClient.invalidateQueries({ queryKey: inviteKeys.byBusiness(variables.businessId) });
      toast.success('Invitación enviada');
    },
    onError: (err) => {
      const msg = (err as Error).message;
      if (msg !== 'members_limit_exceeded') {
        toast.error('Error al enviar invitación', { description: msg });
      }
    },
  });
}
