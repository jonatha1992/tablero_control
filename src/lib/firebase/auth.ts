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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './client';
import type { User, UserRole } from '@/types';

// --- Google Provider ---
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- Auth Helpers ---

export async function login(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return { user: result.user, token: await result.user.getIdToken() };
}

export async function loginWithGoogle() {
  try {
    // Try popup first, fallback to redirect
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserInFirestore(result.user);
    return { user: result.user, token: await result.user.getIdToken() };
  } catch (error: any) {
    // If popup blocked (common in mobile), use redirect
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, googleProvider);
      return null; // Will be handled by getRedirectResult on page load
    }
    throw error;
  }
}

export async function checkGoogleRedirectResult() {
  const result = await getRedirectResult(auth);
  if (result) {
    await ensureUserInFirestore(result.user);
    return { user: result.user, token: await result.user.getIdToken() };
  }
  return null;
}

// Ensure user exists in Firestore after Google login
async function ensureUserInFirestore(fbUser: FirebaseUser) {
  const userDoc = await getDoc(doc(db, 'users', fbUser.uid));

  if (!userDoc.exists()) {
    // Create new user from Google profile
    const name = fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario';
    const email = fbUser.email || '';

    const userData: Record<string, any> = {
      name,
      email,
      role: 'miembro',
      teamIds: [],
      avatar: fbUser.photoURL || null,
      phone: fbUser.phoneNumber || null,
      preferences: {
        theme: 'system',
        locale: 'es',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: {
          email: true,
          push: true,
          agentReports: true,
          agentAlerts: true,
        },
        dashboardLayout: [],
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add optional fields if they have values
    if (fbUser.photoURL) userData.avatar = fbUser.photoURL;
    if (fbUser.phoneNumber) userData.phone = fbUser.phoneNumber;

    await setDoc(doc(db, 'users', fbUser.uid), userData);
  } else {
    // Update last login
    await setDoc(doc(db, 'users', fbUser.uid), {
      lastLogin: serverTimestamp(),
      avatar: fbUser.photoURL || userDoc.data().avatar,
    }, { merge: true });
  }
}

export async function register(email: string, password: string, name: string, role: UserRole = 'miembro') {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  // Update Firebase Auth profile
  await updateProfile(result.user, { displayName: name });

  // Create user document in Firestore (no undefined values)
  const userData: Record<string, any> = {
    name,
    email,
    role,
    teamIds: [],
    preferences: {
      theme: 'system',
      locale: 'es',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifications: {
        email: true,
        push: true,
        agentReports: true,
        agentAlerts: true,
      },
      dashboardLayout: [],
    },
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', result.user.uid), userData);

  return { user: result.user, token: await result.user.getIdToken() };
}

export async function logout() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return userDoc.data().role as UserRole;
}

export async function getToken(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.getIdToken();
}
