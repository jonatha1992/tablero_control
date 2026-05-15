'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cyclesApi } from '@/lib/api/cycles';
import { cycleKeys } from '@/hooks/queries/use-cycles-query';

export function useUpdateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof cyclesApi.update>[1] }) =>
      cyclesApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      queryClient.invalidateQueries({ queryKey: cycleKeys.detail(id) });
      toast.success('PerÃ­odo actualizado');
    },
    onError: (err) => {
      toast.error('Error al actualizar perÃ­odo', { description: (err as Error).message });
    },
  });
}

export function useDeleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cyclesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      toast.success('PerÃ­odo eliminado');
    },
    onError: (err) => {
      toast.error('Error al eliminar perÃ­odo', { description: (err as Error).message });
    },
  });
}

export function useStartCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cyclesApi.start(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      queryClient.invalidateQueries({ queryKey: cycleKeys.detail(id) });
      toast.success('PerÃ­odo iniciado');
    },
    onError: (err) => {
      toast.error('Error al iniciar perÃ­odo', { description: (err as Error).message });
    },
  });
}

export function useCompleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cyclesApi.complete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      queryClient.invalidateQueries({ queryKey: cycleKeys.detail(id) });
      toast.success('PerÃ­odo completado');
    },
    onError: (err) => {
      toast.error('Error al completar perÃ­odo', { description: (err as Error).message });
    },
  });
}
