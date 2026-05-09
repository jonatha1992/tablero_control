import type { Invoice, Subscription, PlanId, BillingFrequency } from '@/types/domain/subscription';
import type { PlanDefinition } from '@/lib/mercadopago/plans';
import { getToken } from '@/lib/firebase/auth';
import { ApiError } from './errors';

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

export const billingApi = {
  getPlans: () =>
    fetch('/api/planes').then((r) => r.json() as Promise<{ plans: PlanDefinition[] }>),

  getSubscription: () =>
    fetchJsonAuth<Subscription | null>('/api/business/subscription'),

  getInvoices: (subscriptionId?: string) => {
    const params = subscriptionId ? `?subscriptionId=${subscriptionId}` : '';
    return fetchJsonAuth<Invoice[]>(`/api/business/invoices${params}`);
  },

  createPreapproval: (plan: PlanId, frequency: BillingFrequency, businessId: string) =>
    fetchJsonAuth<{ initPoint: string }>('/api/mercadopago/preapproval', {
      method: 'POST',
      body: JSON.stringify({ plan, frequency, businessId }),
    }),

  cancelSubscription: (subscriptionId: string) =>
    fetchJsonAuth<{ success: boolean }>('/api/mercadopago/cancel', {
      method: 'POST',
      body: JSON.stringify({ subscriptionId }),
    }),

  syncSubscription: (businessId: string) =>
    fetchJsonAuth<{ status: string; synced: boolean; reason?: string }>('/api/mercadopago/sync', {
      method: 'POST',
      body: JSON.stringify({ businessId }),
    }),

  recoverSubscription: (businessId: string) =>
    fetchJsonAuth<{ recovered: number; total: number; errors?: string[] }>('/api/mercadopago/recover', {
      method: 'POST',
      body: JSON.stringify({ businessId }),
    }),
};
