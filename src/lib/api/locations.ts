import type { Location } from '@/types/domain/location';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const locationsApi = {
  getByBusiness: (businessId: string) =>
    fetchJson<Location[]>(`/api/locations?businessId=${businessId}`),

  getActive: (businessId: string) =>
    fetchJson<Location[]>(`/api/locations?businessId=${businessId}&status=active`),
};
