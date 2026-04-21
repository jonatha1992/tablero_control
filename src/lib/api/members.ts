import type { User } from '@/types/domain/user';
import type { InviteMemberDTO, UpdateMemberDTO } from '@/types/dto/team.dto';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const membersApi = {
  getByBusiness: (businessId: string) =>
    fetchJson<User[]>(`/api/members?businessId=${businessId}`),

  invite: (dto: InviteMemberDTO, businessId: string) =>
    fetchJson<User>('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dto, businessId }),
    }),

  update: (id: string, data: UpdateMemberDTO) =>
    fetchJson<User>(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    fetch(`/api/members/${id}`, { method: 'DELETE' }).then((r) => {
      if (!r.ok) throw new Error('Error al eliminar miembro');
    }),
};
