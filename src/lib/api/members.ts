import type { User } from '@/types/domain/user';
import type { InviteMemberDTO, UpdateMemberDTO } from '@/types/dto/team.dto';
import { getToken } from '@/lib/firebase/auth';
import { ApiError, parseApiErrorBody } from './errors';

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    const { message, code } = parseApiErrorBody(text);
    throw new ApiError(message, res.status, code);
  }
  return res.json();
}

export const membersApi = {
  getByBusiness: (businessId: string, signal?: AbortSignal) =>
    fetchJsonAuth<User[]>(`/api/members?businessId=${businessId}`, { signal }),

  invite: (dto: InviteMemberDTO, businessId: string) =>
    fetchJsonAuth<User>('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dto, businessId }),
    }),

  update: (id: string, data: UpdateMemberDTO) =>
    fetchJsonAuth<User>(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    fetchJsonAuth<never>(`/api/members/${id}`, {
      method: 'DELETE',
    }),

  leave: (newOwnerId?: string) =>
    fetchJsonAuth<{ ok: true; remainingBusinesses: number; isPlatformSuperAdmin: boolean }>('/api/members/leave', {
      method: 'POST',
      ...(newOwnerId ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newOwnerId }) } : {}),
    }),

  bulkAssignLocation: (ids: string[], locationId: string | null) =>
    fetchJsonAuth<{ updated: number }>('/api/members/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, locationId }),
    }),
};
