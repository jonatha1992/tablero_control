'use client';

import { useMutation } from '@tanstack/react-query';
import { invitesApi } from '@/lib/api/invites';

export function useAcceptInvite() {
  return useMutation({
    mutationFn: (token: string) => invitesApi.accept(token),
  });
}
