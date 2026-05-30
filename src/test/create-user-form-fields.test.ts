import { describe, it, expect } from 'vitest';
import { createUserFormFields } from '@/components/equipo/create-user-form-fields';

describe('createUserFormFields', () => {
  it('email: correo + toggle contraseña, sin username', () => {
    const f = createUserFormFields('email');
    expect(f.showEmail).toBe(true);
    expect(f.showUsername).toBe(false);
    expect(f.showPasswordToggle).toBe(true);
    expect(f.emailLabel).toBe('Correo electrónico');
  });

  it('username: solo usuario, sin email ni toggle', () => {
    const f = createUserFormFields('username');
    expect(f.showEmail).toBe(false);
    expect(f.showUsername).toBe(true);
    expect(f.showPasswordToggle).toBe(false);
  });

  it('google: gmail, sin password toggle', () => {
    const f = createUserFormFields('google');
    expect(f.showEmail).toBe(true);
    expect(f.showUsername).toBe(false);
    expect(f.showPasswordToggle).toBe(false);
    expect(f.emailLabel).toBe('Gmail');
  });

  it('ghost: sin email ni username', () => {
    const f = createUserFormFields('ghost');
    expect(f.showEmail).toBe(false);
    expect(f.showUsername).toBe(false);
    expect(f.showPasswordToggle).toBe(false);
  });
});
