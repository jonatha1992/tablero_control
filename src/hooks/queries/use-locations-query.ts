'use client';

import { useQuery } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';
import { useAuth } from '@/hooks/auth-context';

export const locationKeys = {
  all: ['locations'] as const,
  byBusiness: (businessId: string) => [...locationKeys.all, businessId] as const,
};

export function useLocationsQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: locationKeys.byBusiness(user?.businessId ?? ''),
    queryFn: () => locationService.getByBusiness(user!.businessId!),
    enabled: !!user?.businessId,
    staleTime: 1000 * 60 * 15,
  });
}

export function useActiveLocationsQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...locationKeys.byBusiness(user?.businessId ?? ''), 'active'],
    queryFn: () => locationService.getActiveLocations(user!.businessId!),
    enabled: !!user?.businessId,
    staleTime: 1000 * 60 * 15,
  });
}
