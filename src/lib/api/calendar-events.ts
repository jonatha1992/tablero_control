import type { CalendarEvent, CreateCalendarEventDTO } from '@/types/domain/calendar';
import { getToken } from '@/lib/firebase/auth';
import { ApiError } from './errors';

async function fetchJsonAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

export const calendarEventsApi = {
  list: (from?: Date, to?: Date) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from.toISOString());
    if (to) params.set('to', to.toISOString());
    return fetchJsonAuth<CalendarEvent[]>(`/api/calendar-events?${params}`);
  },
  create: (dto: CreateCalendarEventDTO) =>
    fetchJsonAuth<CalendarEvent>('/api/calendar-events', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  update: (id: string, dto: Partial<CreateCalendarEventDTO>) =>
    fetchJsonAuth<CalendarEvent>(`/api/calendar-events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
  delete: async (id: string) => {
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/calendar-events/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new ApiError('Error al eliminar evento', res.status);
  },
};
