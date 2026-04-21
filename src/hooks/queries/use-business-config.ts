'use client';

import { useQuery } from '@tanstack/react-query';
import { auth } from '@/lib/firebase/client';
import type { Business } from '@/types/domain/business';

async function fetchBusinessConfig(): Promise<Business> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No hay sesión activa');

  const res = await fetch('/api/business/config', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al obtener la configuración');
  }

  return res.json();
}

export function useBusinessConfig() {
  return useQuery({
    queryKey: ['business-config'],
    queryFn: fetchBusinessConfig,
    staleTime: 1000 * 60 * 5,
  });
}
