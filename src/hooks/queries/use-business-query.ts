'use client';

import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Business } from '@/types/domain/business';

async function fetchBusiness(businessId: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, 'businesses', businessId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Business, 'id'>) };
}

export function useBusinessQuery(businessId?: string) {
  return useQuery({
    queryKey: ['business', businessId],
    queryFn: () => fetchBusiness(businessId!),
    enabled: Boolean(businessId),
    staleTime: 1000 * 60 * 5,
  });
}
