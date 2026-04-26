import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginWithGoogle, checkGoogleRedirectResult } from '@/lib/firebase/auth';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSignInWithPopup = vi.mocked(signInWithPopup);
const mockSignInWithRedirect = vi.mocked(signInWithRedirect);
const mockGetRedirectResult = vi.mocked(getRedirectResult);

const mockUser = {
  uid: 'user-1',
  email: 'test@gmail.com',
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── loginWithGoogle ─────────────────────────────────────────────────────────

describe('loginWithGoogle()', () => {
  it('retorna user y token si signInWithPopup tiene éxito', async () => {
    mockSignInWithPopup.mockResolvedValueOnce({ user: mockUser } as never);

    const result = await loginWithGoogle();

    expect(mockSignInWithPopup).toHaveBeenCalledOnce();
    expect(result).not.toBeNull();
    expect(result?.user.uid).toBe('user-1');
    expect(result?.token).toBe('mock-token');
  });

  it('llama a signInWithRedirect y retorna null si popup es bloqueado', async () => {
    const popupError = new Error('Popup blocked') as Error & { code: string };
    popupError.code = 'auth/popup-blocked';
    mockSignInWithPopup.mockRejectedValueOnce(popupError);
    mockSignInWithRedirect.mockResolvedValueOnce(undefined as never);

    const result = await loginWithGoogle();

    expect(mockSignInWithPopup).toHaveBeenCalledOnce();
    expect(mockSignInWithRedirect).toHaveBeenCalledOnce();
    expect(result).toBeNull();
  });

  it('llama a signInWithRedirect y retorna null si popup es cerrado por el usuario', async () => {
    const popupError = new Error('Popup closed') as Error & { code: string };
    popupError.code = 'auth/popup-closed-by-user';
    mockSignInWithPopup.mockRejectedValueOnce(popupError);
    mockSignInWithRedirect.mockResolvedValueOnce(undefined as never);

    const result = await loginWithGoogle();

    expect(mockSignInWithPopup).toHaveBeenCalledOnce();
    expect(mockSignInWithRedirect).toHaveBeenCalledOnce();
    expect(result).toBeNull();
  });

  it('relanza el error si es distinto a popup-blocked/closed', async () => {
    const otherError = new Error('Network error') as Error & { code: string };
    otherError.code = 'auth/network-request-failed';
    mockSignInWithPopup.mockRejectedValueOnce(otherError);

    await expect(loginWithGoogle()).rejects.toThrow('Network error');
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
  });
});

// ─── checkGoogleRedirectResult ────────────────────────────────────────────────

describe('checkGoogleRedirectResult()', () => {
  it('retorna user y token si hay resultado de redirección', async () => {
    mockGetRedirectResult.mockResolvedValueOnce({ user: mockUser } as never);

    const result = await checkGoogleRedirectResult();

    expect(mockGetRedirectResult).toHaveBeenCalledOnce();
    expect(result).not.toBeNull();
    expect(result?.user.uid).toBe('user-1');
    expect(result?.token).toBe('mock-token');
  });

  it('retorna null si no hay resultado de redirección', async () => {
    mockGetRedirectResult.mockResolvedValueOnce(null);

    const result = await checkGoogleRedirectResult();

    expect(mockGetRedirectResult).toHaveBeenCalledOnce();
    expect(result).toBeNull();
  });
});
