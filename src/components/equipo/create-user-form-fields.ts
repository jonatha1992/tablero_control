import type { CreateUserMode } from '@/app/api/users/create/route';

export function fieldLabel(base: string, required: boolean): string {
  return required ? base : `${base} (Opcional)`;
}

export type CreateUserFormFieldsOptions = {
  /** Solo aplica en modo email: contraseña visible y obligatoria si true. */
  createAccess?: boolean;
};

/** Campos visibles por modo — usado en tests y en el modal. */
export function createUserFormFields(
  mode: CreateUserMode,
  options: CreateUserFormFieldsOptions = {}
) {
  const createAccess = options.createAccess ?? true;
  const emailRequired = mode === 'email' || mode === 'google';
  const usernameRequired = mode === 'username';
  const passwordRequired = mode === 'username' || (mode === 'email' && createAccess);

  return {
    showEmail: mode === 'email' || mode === 'google',
    showUsername: mode === 'username',
    showPasswordToggle: mode === 'email',
    showPassword: mode === 'username' || mode === 'email',
    emailRequired,
    usernameRequired,
    passwordRequired,
    nameLabel: fieldLabel('Nombre completo', true),
    emailLabel: fieldLabel(
      mode === 'google' ? 'Gmail' : 'Correo electrónico',
      emailRequired
    ),
    usernameLabel: fieldLabel('Nombre de usuario', usernameRequired),
    passwordLabel: fieldLabel('Contraseña inicial', passwordRequired),
    emailPlaceholder: mode === 'google' ? 'usuario@gmail.com' : 'juan@empresa.com',
  };
}
