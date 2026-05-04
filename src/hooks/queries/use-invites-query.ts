'use client';

import { useQuery } from '@tanstack/react-query';
import { invitesApi } from '@/lib/api/invites';

export const inviteKeys = {
  all: ['invites'] as const,
  byBusiness: (businessId: string) => [...inviteKeys.all, 'byBusiness', businessId] as const,
};

export function useInvitesQuery(businessId?: string) {
  return useQuery({
    queryKey: inviteKeys.byBusiness(businessId || ''),
    queryFn: () => invitesApi.getByBusiness(businessId!),
    enabled: !!businessId,
  });
}
