'use client';

import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Subscription } from '@/types/domain/subscription';

async function fetchSubscription(businessId: string): Promise<Subscription | null> {
  const q = query(
    collection(db, 'subscriptions'),
    where('businessId', '==', businessId),
    where('status', 'in', ['active', 'pending', 'paused', 'trialing']),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Subscription, 'id'>) };
}

export function useSubscriptionQuery(businessId?: string) {
  return useQuery({
    queryKey: ['subscription', businessId],
    queryFn: () => fetchSubscription(businessId!),
    enabled: Boolean(businessId),
    staleTime: 1000 * 60 * 5,
  });
}
