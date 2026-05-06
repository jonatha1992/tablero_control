'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberKeys } from '@/hooks/queries/use-members-query';
import { membersApi } from '@/lib/api/members';
import { toast } from 'sonner';

export function useBulkAssignLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, locationId }: { ids: string[]; locationId: string | null }) =>
      membersApi.bulkAssignLocation(ids, locationId),
    onSuccess: (data: { updated: number }) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      toast.success(
        `${data.updated} miembro${data.updated !== 1 ? 's' : ''} asignado${data.updated !== 1 ? 's' : ''} al sector`
      );
    },
    onError: (err: Error) => {
      toast.error('Error al asignar sector', { description: err.message });
    },
  });
}
