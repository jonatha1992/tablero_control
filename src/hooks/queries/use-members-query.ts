'use client';

import { useQuery } from '@tanstack/react-query';
import { teamService } from '@/services/team.service';
import { useAuth } from '@/hooks/auth-context';

export const memberKeys = {
  all: ['members'] as const,
  byBusiness: (businessId: string) => [...memberKeys.all, businessId] as const,
};

export function useMembersQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: memberKeys.byBusiness(user?.businessId ?? ''),
    queryFn: () => teamService.getMembersByBusiness(user!.businessId!),
    enabled: !!user?.businessId,
    staleTime: 1000 * 60 * 10,
  });
}
