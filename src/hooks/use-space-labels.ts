'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { useBusinessQuery } from '@/hooks/queries/use-business-query';
import { resolveSpaceLabels, type SpaceLabels } from '@/lib/terminology';

/** Active espacio UI labels (locations configurable per business settings). */
export function useSpaceLabels(): SpaceLabels {
  const { user } = useAuth();
  const { data: business } = useBusinessQuery(user?.businessId);
  return useMemo(() => resolveSpaceLabels(business?.settings), [business?.settings]);
}
