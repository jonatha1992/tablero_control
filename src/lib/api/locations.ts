import type { Location } from '@/types/domain/location';
import { getToken } from '@/lib/firebase/auth';

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const locationsApi = {
  getByBusiness: (businessId: string) =>
    fetchJsonAuth<Location[]>(`/api/locations?businessId=${businessId}`),

  getActive: (businessId: string) =>
    fetchJsonAuth<Location[]>(`/api/locations?businessId=${businessId}&status=active`),

  create: (data: Partial<Location>) =>
    fetchJsonAuth<Location>('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Location>) =>
    fetchJsonAuth<Location>(`/api/locations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchJsonAuth<never>(`/api/locations/${id}`, {
      method: 'DELETE',
    }),
};
