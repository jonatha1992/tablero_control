import type { User } from '@/types/domain/user';
import type { InviteMemberDTO, UpdateMemberDTO } from '@/types/dto/team.dto';
import { getToken } from '@/lib/firebase/auth';
import { ApiError } from './errors';

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

export const membersApi = {
  getByBusiness: (businessId: string) =>
    fetchJsonAuth<User[]>(`/api/members?businessId=${businessId}`),

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

  bulkAssignLocation: (ids: string[], locationId: string | null) =>
    fetchJsonAuth<{ updated: number }>('/api/members/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, locationId }),
    }),
};
