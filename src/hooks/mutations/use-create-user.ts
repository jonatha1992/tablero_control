'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getToken } from '@/lib/firebase/auth';
import { memberKeys } from '@/hooks/queries/use-members-query';
import type { UserRole } from '@/types/domain/user';
import type { CreateUserResult, CreateUserMode } from '@/app/api/users/create/route';

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  businessId?: string;
  locationId?: string;
}

export class EmailInactiveError extends Error {
  userId: string;
  constructor(userId: string) {
    super('email_inactive');
    this.userId = userId;
  }
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
    const data = await res.json().catch(() => ({ error: 'unknown' }));
    const { error } = data as { error: string; limit?: number; current?: number; userId?: string };
    if (error === 'email_inactive') throw new EmailInactiveError((data as { userId: string }).userId);
    if (error === 'username_already_exists') throw new Error('El nombre de usuario ya está en uso');
    if (error === 'email_already_exists') throw new Error('El email ya está registrado');
    if (error === 'forbidden') throw new Error('Sin permisos para crear este tipo de usuario');
    if (error === 'members_limit_exceeded') {
      const err = new Error('members_limit_exceeded') as Error & { limit?: number; current?: number };
      err.limit = (data as { limit?: number }).limit;
      err.current = (data as { current?: number }).current;
      throw err;
    }
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
      toast.success('Usuario creado');
    },
    onError: (err) => {
      const msg = (err as Error).message;
      if (msg !== 'members_limit_exceeded') {
        toast.error('Error al crear usuario', { description: msg });
      }
    },
  });
}
