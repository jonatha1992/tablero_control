'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase/client';
import type { Business } from '@/types/domain/business';

async function updateBusinessConfig(data: Partial<Business>) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No hay sesión activa');

  const res = await fetch('/api/business/config', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al actualizar la configuración');
  }

  return res.json();
}

export function useUpdateBusinessConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBusinessConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-config'] });
      process.env.NODE_ENV === 'development' && console.log('Configuración actualizada correctamente');
    },
    onError: (error: Error) => {
      console.error('Error al actualizar:', error.message);
    },
  });
}
