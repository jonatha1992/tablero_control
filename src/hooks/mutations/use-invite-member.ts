'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '@/services/team.service';
import { useAuth } from '@/hooks/auth-context';
import { memberKeys } from '@/hooks/queries/use-members-query';
import type { InviteMemberDTO } from '@/types/dto/team.dto';

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (dto: InviteMemberDTO) =>
      teamService.inviteMember(dto, user!.businessId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
