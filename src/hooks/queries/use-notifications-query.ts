'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getToken } from '@/lib/firebase/auth';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

async function fetchAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const notificationKeys = {
  all: ['notifications'] as const,
};

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () =>
      fetchAuth<{ notifications: AppNotification[]; unreadCount: number }>(
        '/api/notifications'
      ),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 45_000,
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchAuth('/api/notifications', { method: 'PATCH' }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkOneReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchAuth(`/api/notifications/${id}`, { method: 'PATCH' }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
