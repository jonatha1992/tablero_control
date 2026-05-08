'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api/locations';
import { locationKeys } from '@/hooks/queries/use-locations-query';
import { toast } from 'sonner';
import type { Location } from '@/types/domain/location';

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Location>) => locationsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.byBusiness(variables.businessId ?? '') });
      toast.success('Sector creado', {
        description: `"${variables.name}" fue creado exitosamente.`,
      });
    },
    onError: (err: Error) => {
      if (err.message === 'locations_limit_exceeded') return;
      toast.error('Error al crear sector', {
        description: 'Verificá los datos e intentá nuevamente.',
      });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Location> }) =>
      locationsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.byBusiness(data.businessId) });
      toast.success('Sector actualizado', {
        description: `"${data.name}" fue actualizado correctamente.`,
      });
    },
    onError: () => {
      toast.error('Error al actualizar sector', {
        description: 'No se pudo guardar los cambios. Intentá nuevamente.',
      });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, businessId: _businessId }: { id: string; businessId: string }) =>
      locationsApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.byBusiness(variables.businessId) });
      toast.success('Sector eliminado', {
        description: 'El sector fue eliminado del sistema.',
      });
    },
    onError: () => {
      toast.error('Error al eliminar sector', {
        description: 'No se pudo eliminar el sector. Intentá nuevamente.',
      });
    },
  });
}
