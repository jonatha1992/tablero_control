'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api/members';
import { memberKeys } from '@/hooks/queries/use-members-query';
import type { UpdateMemberDTO } from '@/types/dto/team.dto';
import type { User } from '@/types/domain/user';
import { useAuth } from '@/hooks/auth-context';
import { toast } from 'sonner';

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberDTO }) =>
      membersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      toast.success('Miembro actualizado');
    },
    onError: (err: Error) => {
      toast.error('Error al actualizar miembro', { description: err.message });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => membersApi.remove(id),
    onMutate: async (id: string) => {
      const key = memberKeys.byBusiness(user?.businessId ?? '');
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<User[]>(key);
      queryClient.setQueryData<User[]>(key, (old = []) => old.filter((m) => m.id !== id));
      return { previous, key };
    },
<<<<<<< HEAD
    onError: (err: Error, _id: string, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      if (err.message?.includes('cannot_remove_owner')) {
        toast.error('No se puede eliminar al propietario del negocio');
      } else {
        toast.error('Error al eliminar miembro');
      }
=======
    onError: (_err: Error, _id: string, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      toast.error('Error al eliminar miembro');
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    },
    onSuccess: () => {
      toast.success('Miembro eliminado del equipo');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
