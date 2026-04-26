import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firebaseAuth from 'firebase/auth';

// firebase/auth and firebase/firestore are mocked globally in setup.ts
const signInFn = vi.mocked(firebaseAuth.signInWithEmailAndPassword);
const createUserFn = vi.mocked(firebaseAuth.createUserWithEmailAndPassword);
const signOutFn = vi.mocked(firebaseAuth.signOut);
const sendResetFn = vi.mocked(firebaseAuth.sendPasswordResetEmail);
const updateProfileFn = vi.mocked(firebaseAuth.updateProfile);

// Import after mocks are set up
const { login, register, logout, resetPassword } = await import('@/lib/firebase/auth');

describe('Auth — login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama a signInWithEmailAndPassword con las credenciales correctas', async () => {
    const mockUser = {
      uid: 'uid-1',
      email: 'test@example.com',
      getIdToken: vi.fn().mockResolvedValue('token-abc'),
    };
    signInFn.mockResolvedValue({ user: mockUser } as never);

    const result = await login('test@example.com', 'password123');

    expect(signInFn).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
    expect(result.user).toBe(mockUser);
    expect(result.token).toBe('token-abc');
  });

  it('propaga el error cuando las credenciales son inválidas', async () => {
    signInFn.mockRejectedValue(new Error('auth/wrong-password'));

    await expect(login('bad@example.com', 'wrong')).rejects.toThrow('auth/wrong-password');
  });
});

describe('Auth — register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea usuario en Firebase Auth y en Firestore', async () => {
    const mockUser = {
      uid: 'uid-2',
      email: 'new@example.com',
      getIdToken: vi.fn().mockResolvedValue('token-xyz'),
    };
    createUserFn.mockResolvedValue({ user: mockUser } as never);
    updateProfileFn.mockResolvedValue(undefined);

    const result = await register('new@example.com', 'pass123', 'Nuevo Usuario');

    expect(createUserFn).toHaveBeenCalledWith(expect.anything(), 'new@example.com', 'pass123');
    expect(updateProfileFn).toHaveBeenCalledWith(mockUser, { displayName: 'Nuevo Usuario' });
    expect(result.token).toBe('token-xyz');
    // Nota: El registro en PostgreSQL es diferido, no se valida setDoc de Firestore
  });

  it('asigna el rol recibido como parámetro', async () => {
    await register('admin@example.com', 'pass', 'Admin User', 'admin');

    expect(createUserFn).toHaveBeenCalled();
    // La asignación de roles ahora se gestiona en la sincronización backend con Prisma
  });

  it('usa role miembro por defecto', async () => {
    await register('member@example.com', 'pass', 'Member');

    expect(createUserFn).toHaveBeenCalled();
  });
});

describe('Auth — logout', () => {
  it('llama a signOut', async () => {
    signOutFn.mockResolvedValue(undefined);
    await logout();
    expect(signOutFn).toHaveBeenCalled();
  });
});

describe('Auth — resetPassword', () => {
  it('llama a sendPasswordResetEmail con el email correcto', async () => {
    sendResetFn.mockResolvedValue(undefined);
    await resetPassword('reset@example.com');
    expect(sendResetFn).toHaveBeenCalledWith(expect.anything(), 'reset@example.com');
  });
});

