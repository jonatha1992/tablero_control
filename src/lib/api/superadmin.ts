import { auth } from '@/lib/firebase/client';

async function fetchSA<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const superadminApi = {
  getUsers: (sort?: string, order?: 'asc' | 'desc') => {
    const qs = sort ? `?sort=${sort}&order=${order}` : '';
    return fetchSA<{ users: unknown[] }>(`/api/superadmin/users${qs}`);
  },
  getBusinesses: () => fetchSA<{ businesses: unknown[] }>('/api/superadmin/businesses'),
  getBusiness: (id: string) =>
    fetchSA<{ business: unknown; users: unknown[]; locations: unknown[]; teams?: unknown[]; projects?: unknown[] }>(
      `/api/superadmin/businesses/${id}`
    ),
  getSubscriptions: () => fetchSA<{ subscriptions: unknown[] }>('/api/superadmin/subscriptions'),
  getAudit: () => fetchSA<{ logs: unknown[] }>('/api/superadmin/audit'),
  deleteUser: async (id: string, deleteBusinesses = false) => {
    const token = await auth.currentUser?.getIdToken();
    const url = `/api/superadmin/users/${id}${deleteBusinesses ? '?deleteBusinesses=true' : ''}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  bulkDeleteUsers: async (ids: string[], deleteBusinesses = false) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/superadmin/users/bulk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, deleteBusinesses }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ deleted: number; errors: Array<{ id: string; reason: string }> }>;
  },
  changePlan: async (businessId: string, plan: string) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`/api/superadmin/subscriptions/${businessId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  deleteBusiness: async (businessId: string) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`/api/superadmin/businesses/${businessId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  patchBusiness: async (businessId: string, action: 'suspend' | 'reactivate') => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/superadmin/businesses', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, action }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
