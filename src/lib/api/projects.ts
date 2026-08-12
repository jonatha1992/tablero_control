import { getToken } from '@/lib/firebase/auth';
import { ApiError } from './errors';

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
  openTaskCount?: number;
}

export interface CreateProjectBody {
  name: string;
  description?: string;
  teamId?: string;
  businessId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectBody {
  name?: string;
  description?: string;
  teamId?: string | null;
  businessId?: string;
  status?: string;
  action?: 'archive' | 'restore';
  startDate?: string | null;
  endDate?: string | null;
}

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
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

  update: (id: string, data: UpdateProjectBody) =>
    fetchJsonAuth<Project>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: async (id: string) => {
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`/api/projects/${id}`, { method: 'DELETE', headers });
    if (!r.ok) throw new ApiError('Error al eliminar tablero', r.status);
    return r.json();
  },
};
