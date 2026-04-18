import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseFirestore from 'firebase/firestore';

// firebase/auth and firebase/firestore are mocked globally in setup.ts
const signInFn = vi.mocked(firebaseAuth.signInWithEmailAndPassword);
const createUserFn = vi.mocked(firebaseAuth.createUserWithEmailAndPassword);
const signOutFn = vi.mocked(firebaseAuth.signOut);
const sendResetFn = vi.mocked(firebaseAuth.sendPasswordResetEmail);
const updateProfileFn = vi.mocked(firebaseAuth.updateProfile);
const getDocFn = vi.mocked(firebaseFirestore.getDoc);
const setDocFn = vi.mocked(firebaseFirestore.setDoc);

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
    setDocFn.mockResolvedValue(undefined);

    const result = await register('new@example.com', 'pass123', 'Nuevo Usuario');

    expect(createUserFn).toHaveBeenCalledWith(expect.anything(), 'new@example.com', 'pass123');
    expect(updateProfileFn).toHaveBeenCalledWith(mockUser, { displayName: 'Nuevo Usuario' });
    expect(setDocFn).toHaveBeenCalled();
    expect(result.token).toBe('token-xyz');
  });

  it('asigna el rol recibido como parámetro', async () => {
    const mockUser = {
      uid: 'uid-3',
      email: 'admin@example.com',
      getIdToken: vi.fn().mockResolvedValue('t'),
    };
    createUserFn.mockResolvedValue({ user: mockUser } as never);
    updateProfileFn.mockResolvedValue(undefined);

    let savedData: Record<string, unknown> = {};
    setDocFn.mockImplementation((_ref: unknown, data: unknown) => {
      savedData = data as Record<string, unknown>;
      return Promise.resolve();
    });

    await register('admin@example.com', 'pass', 'Admin User', 'admin');

    expect(savedData.role).toBe('admin');
  });

  it('usa role miembro por defecto', async () => {
    const mockUser = {
      uid: 'uid-4',
      email: 'member@example.com',
      getIdToken: vi.fn().mockResolvedValue('t'),
    };
    createUserFn.mockResolvedValue({ user: mockUser } as never);
    updateProfileFn.mockResolvedValue(undefined);

    let savedData: Record<string, unknown> = {};
    setDocFn.mockImplementation((_ref: unknown, data: unknown) => {
      savedData = data as Record<string, unknown>;
      return Promise.resolve();
    });

    await register('member@example.com', 'pass', 'Member');

    expect(savedData.role).toBe('miembro');
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

