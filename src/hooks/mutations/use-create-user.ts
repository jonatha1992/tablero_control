'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getToken } from '@/lib/firebase/auth';
import { memberKeys } from '@/hooks/queries/use-members-query';
import type { UserRole } from '@/types/domain/user';
import type { CreateUserResult } from '@/app/api/users/create/route';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  businessId?: string;
}

async function createUserViaApi(input: CreateUserInput): Promise<CreateUserResult> {
  const token = await getToken();
  if (!token) throw new Error('No autenticado');

  const res = await fetch('/api/users/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: 'unknown' }));
    if (error === 'email_already_exists') throw new Error('El email ya está registrado');
    if (error === 'forbidden') throw new Error('Sin permisos para crear este tipo de usuario');
    throw new Error('No se pudo crear el usuario');
  }

  return res.json();
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUserViaApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
