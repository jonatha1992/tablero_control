import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api/locations';
import type { Location } from '@/types/domain/location';

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Location>) => locationsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locations', variables.businessId] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Location> }) => 
      locationsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locations', data.businessId] });
      queryClient.invalidateQueries({ queryKey: ['location', data.id] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, businessId }: { id: string; businessId: string }) => 
      locationsApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locations', variables.businessId] });
    },
  });
}
