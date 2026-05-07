'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { objectivesApi } from '@/lib/api/objectives';
import { objectiveKeys } from '@/hooks/queries/use-objectives-query';

export function useUpdateObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof objectivesApi.update>[1] }) =>
      objectivesApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      queryClient.invalidateQueries({ queryKey: objectiveKeys.detail(id) });
      toast.success('Objetivo actualizado');
    },
    onError: (err: Error) => {
      toast.error('Error al actualizar el objetivo', { description: err.message });
    },
  });
}

export function useDeleteObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => objectivesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      toast.success('Objetivo eliminado');
    },
    onError: (err: Error) => {
      toast.error('Error al eliminar el objetivo', { description: err.message });
    },
  });
}

export function useCompleteObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => objectivesApi.complete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      queryClient.invalidateQueries({ queryKey: objectiveKeys.detail(id) });
      toast.success('Objetivo completado');
    },
    onError: (err: Error) => {
      toast.error('Error al completar el objetivo', { description: err.message });
    },
  });
}

export function useArchiveObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => objectivesApi.archive(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      queryClient.invalidateQueries({ queryKey: objectiveKeys.detail(id) });
      toast.success('Objetivo archivado');
    },
    onError: (err: Error) => {
      toast.error('Error al archivar el objetivo', { description: err.message });
    },
  });
}
