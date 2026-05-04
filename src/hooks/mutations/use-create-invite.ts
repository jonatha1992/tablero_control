'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitesApi, type CreateInviteInput } from '@/lib/api/invites';
import { inviteKeys } from '@/hooks/queries/use-invites-query';

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInviteInput) => invitesApi.create(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: inviteKeys.byBusiness(variables.businessId) });
    },
  });
}
