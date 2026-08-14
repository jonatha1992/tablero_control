import { getToken } from '@/lib/firebase/auth';
import type { BusinessInvite } from '@prisma/client';
import { ApiError, parseApiErrorBody } from './errors';

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    const { message, code } = parseApiErrorBody(text);
    if (code === 'members_limit_exceeded') {
      try {
        const body = JSON.parse(text) as { limit?: number; current?: number };
        const err = new Error('members_limit_exceeded') as Error & { limit?: number; current?: number };
        err.limit = body.limit;
        err.current = body.current;
        throw err;
      } catch (e) {
        if (e instanceof Error && e.message === 'members_limit_exceeded') throw e;
      }
    }
    throw new ApiError(message, res.status, code);
  }
  return res.json();
}

export interface CreateInviteInput {
  businessId: string;
  role?: string;
  locationIds?: string[];
  maxUses?: number;
  expiresInDays?: number;
  /** Si se indica, se envía el link `/i/{id}` a este correo (invitación personal). */
  email?: string;
}

export interface InviteWithLink extends BusinessInvite {
  link: string;
  emailSent?: boolean;
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

  prepareAccount: (token: string, name: string, email: string) =>
    fetch(`/api/invites/${token}/prepare-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    }).then(async (r) => {
      if (!r.ok) throw new ApiError(await r.text(), r.status);
      return r.json() as Promise<{ username: string; email: string }>;
    }),

  accept: (token: string, options?: { username?: string }) =>
    fetchJsonAuth<import('@/types/domain/user').User>(`/api/invites/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options?.username ? { username: options.username } : {}),
    }),
};
