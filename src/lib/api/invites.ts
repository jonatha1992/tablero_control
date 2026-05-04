import { getToken } from '@/lib/firebase/auth';
import type { BusinessInvite } from '@prisma/client';

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface CreateInviteInput {
  businessId: string;
  role?: string;
  locationId?: string;
  maxUses?: number;
  expiresInDays?: number;
}

export interface InviteWithLink extends BusinessInvite {
  link: string;
}

export const invitesApi = {
  getByBusiness: (businessId: string) =>
    fetchJsonAuth<BusinessInvite[]>(`/api/invites?businessId=${businessId}`),

  create: (input: CreateInviteInput) =>
    fetchJsonAuth<InviteWithLink>('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  revoke: (id: string) =>
    fetchJsonAuth<{ success: true }>(`/api/invites/${id}`, { method: 'DELETE' }),

  validate: (token: string) =>
    fetch(`/api/invites/${token}`)
      .then((r) => r.json() as Promise<{
        valid: boolean;
        reason?: string;
        businessName?: string;
        role?: string;
        expiresAt?: string;
        usesLeft?: number | null;
      }>),

  accept: (token: string) =>
    fetchJsonAuth<import('@/types/domain/user').User>(`/api/invites/${token}/accept`, {
      method: 'POST',
    }),
};
