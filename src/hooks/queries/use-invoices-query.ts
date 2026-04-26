'use client';

import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';
import type { Invoice } from '@/types/domain/subscription';

export function useInvoicesQuery(businessId?: string, subscriptionId?: string) {
  return useQuery<Invoice[]>({
    queryKey: ['invoices', businessId, subscriptionId],
    queryFn: () => billingApi.getInvoices(subscriptionId),
    enabled: Boolean(businessId),
  });
}
