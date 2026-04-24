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

  create: (data: Partial<Location>) =>
    fetch(`/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error('Error al crear sector');
      return res.json();
    }),

  update: (id: string, data: Partial<Location>) =>
    fetch(`/api/locations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error('Error al actualizar sector');
      return res.json();
    }),

  delete: (id: string) =>
    fetch(`/api/locations/${id}`, {
      method: 'DELETE',
    }).then((res) => {
      if (!res.ok) throw new Error('Error al eliminar sector');
    }),
};
