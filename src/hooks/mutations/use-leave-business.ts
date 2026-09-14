'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api/members';
import { showLeaveBusinessError } from '@/lib/team/leave-business-errors';

/**
 * Leaves the caller's active business (self-service — distinct from useRemoveMember,
 * which is admin-driven and stays blocked for self-removal).
 *
 * On success this hard-navigates: the app has no in-SPA "select business" screen,
 * so — same as useAuth().switchBusiness — a full reload is the safest way to drop
 * every tenant-scoped cache and re-derive auth state from scratch.
 * remainingBusinesses > 0 → '/dashboard' (the profile route auto-falls back to
 * another active membership, see src/app/api/auth/profile/route.ts).
 * remainingBusinesses === 0 → '/register' (existing "authenticated, no PG profile
 * active membership" onboarding flow — see src/app/(auth)/register/page.tsx
 * needsOwnerProvision / src/app/(auth)/login/page.tsx notInvited redirect).
 */
export function useLeaveBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => membersApi.leave(),
    onSuccess: (data) => {
      queryClient.clear();
      window.location.href = data.remainingBusinesses > 0 ? '/dashboard' : '/register';
    },
    onError: (err: Error) => {
      showLeaveBusinessError(err);
    },
  });
}
