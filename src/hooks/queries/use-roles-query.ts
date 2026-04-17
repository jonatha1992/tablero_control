'use client';

import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { CustomRole } from '@/types/domain/custom-role';

async function fetchRoles(businessId: string): Promise<CustomRole[]> {
  const snap = await getDocs(
    query(collection(db, 'businesses', businessId, 'roles'), orderBy('isSystem', 'desc'), orderBy('name'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CustomRole, 'id'>) }));
}

export function useRolesQuery(businessId?: string) {
  return useQuery({
    queryKey: ['roles', businessId],
    queryFn: () => fetchRoles(businessId!),
    enabled: Boolean(businessId),
    staleTime: 1000 * 60 * 2,
  });
}
