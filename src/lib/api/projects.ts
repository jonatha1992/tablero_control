import { getToken } from '@/lib/firebase/auth';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  teamId: string | null;
  businessId: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { tasks: number };
}

export interface CreateProjectBody {
  name: string;
  description?: string;
  teamId?: string;
  businessId?: string;
  startDate?: string;
  endDate?: string;
}

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const projectsApi = {
  getByBusiness: (businessId: string) =>
    fetchJsonAuth<Project[]>(`/api/projects?businessId=${encodeURIComponent(businessId)}`),

  create: (data: CreateProjectBody) =>
    fetchJsonAuth<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateProjectBody>) =>
    fetchJsonAuth<Project>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: async (id: string) => {
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`/api/projects/${id}`, { method: 'DELETE', headers });
    if (!r.ok) throw new Error('Error al eliminar tablero');
    return r.json();
  },
};
