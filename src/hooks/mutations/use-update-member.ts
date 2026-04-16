'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '@/services/team.service';
import { memberKeys } from '@/hooks/queries/use-members-query';
import type { UpdateMemberDTO } from '@/types/dto/team.dto';

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberDTO }) =>
      teamService.updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamService.removeMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
