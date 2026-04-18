import { auth } from '@/lib/firebase/client';

async function fetchSA<T>(path: string): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const superadminApi = {
  getUsers: () => fetchSA<{ users: unknown[] }>('/api/superadmin/users'),
  getBusinesses: () => fetchSA<{ businesses: unknown[] }>('/api/superadmin/businesses'),
  getBusiness: (id: string) => fetchSA<{ business: unknown; users: unknown[]; locations: unknown[] }>(`/api/superadmin/businesses/${id}`),
  getSubscriptions: () => fetchSA<{ subscriptions: unknown[] }>('/api/superadmin/subscriptions'),
  getAudit: () => fetchSA<{ logs: unknown[] }>('/api/superadmin/audit'),
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
