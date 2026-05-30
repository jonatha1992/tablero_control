import type { CreateUserMode } from '@/app/api/users/create/route';

/** Campos visibles por modo — usado en tests y en el modal. */
export function createUserFormFields(mode: CreateUserMode) {
  return {
    showEmail: mode === 'email' || mode === 'google',
    showUsername: mode === 'username',
    showPasswordToggle: mode === 'email',
    showPassword: mode === 'username' || (mode === 'email'),
    passwordRequired: mode === 'username' || mode === 'email',
    emailLabel: mode === 'google' ? 'Gmail' : 'Correo electrónico',
    emailPlaceholder: mode === 'google' ? 'usuario@gmail.com' : 'juan@empresa.com',
  };
}
