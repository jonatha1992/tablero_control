'use client';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth } from './client';
import type { UserRole } from '@/types';

// --- Google Provider ---
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Eagerly call getRedirectResult at module-load time (before any React lifecycle).
// Firebase Auth fires its internal redirect event bus as soon as the module loads
// (to restore pending redirects from IndexedDB). If getRedirectResult hasn't been
// called yet when that event fires, Firebase throws:
//   INTERNAL ASSERTION FAILED: Pending promise was never set
// By calling it here we register the handler immediately, before React effects run.
type RedirectPayload = { user: FirebaseUser; token: string } | null;
let _earlyRedirectResult: Promise<RedirectPayload> | null = null;

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_EMULATOR !== 'true') {
  _earlyRedirectResult = getRedirectResult(auth)
    .then(async (result): Promise<RedirectPayload> => {
      if (!result) return null;
      return { user: result.user, token: await result.user.getIdToken() };
    })
    .catch((): null => null);
}

// --- Auth Helpers ---

export async function login(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, token: await result.user.getIdToken() };
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/network-request-failed' && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
      throw new Error(
        'El emulador de Firebase Auth no está corriendo. Usá "npm run dev:all" en lugar de "npm run dev".',
      );
    }
    throw error;
  }
}

/** Detect mobile/tablet where popups are unreliable. */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

export async function loginWithGoogle() {
  if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
    throw new Error(
      'Google Sign-In no está disponible en el emulador de Firebase. ' +
      'Usá email y contraseña con las credenciales de prueba.',
    );
  }

  // #18: Mobile browsers block popups almost always → use redirect directly.
  if (isMobileDevice()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, token: await result.user.getIdToken() };
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

export async function checkGoogleRedirectResult(): Promise<RedirectPayload> {
  // Return the eagerly-resolved promise; falls back to a fresh call only when the
  // module was loaded server-side or in emulator mode (neither initialises the early promise).
  if (_earlyRedirectResult) return _earlyRedirectResult;
  const result = await getRedirectResult(auth).catch(() => null);
  if (result) {
    return { user: result.user, token: await result.user.getIdToken() };
  }
  return null;
}

export async function register(email: string, password: string, name: string, _role: UserRole = 'miembro') {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  // User record in PostgreSQL is created on first /api/auth/profile call
  return { user: result.user, token: await result.user.getIdToken(true) };
}

export async function logout() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

async function getCurrentUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    // `onAuthStateChanged` may invoke the callback synchronously (e.g. in tests/mocks).
    // If we call `unsubscribe()` inline, it can run before the variable is assigned.
    const unsub = { current: undefined as undefined | (() => void) };
    unsub.current = onAuthStateChanged(auth, (user) => {
      queueMicrotask(() => unsub.current?.());
      resolve(user);
    });
  });
}

export async function getToken(): Promise<string | null> {
  // Optimizamos usando el usuario en memoria si ya está disponible (sin espera)
  if (auth.currentUser) {
    return auth.currentUser.getIdToken();
  }

  // Fallback para la carga inicial de la app
  const user = await getCurrentUser();
  if (!user) return null;
  return user.getIdToken();
}
