'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { authService } from '@/services/auth.service';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  notInvited: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(fbUser: FirebaseUser): Promise<User | null> {
  const token = await fbUser.getIdToken();
  const res = await fetch('/api/auth/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const profile = await res.json();
  return { ...profile, avatar: profile.avatar || fbUser.photoURL || undefined };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notInvited, setNotInvited] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const token = await fbUser.getIdToken();
        const res = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const profile = await res.json();
          setUser({ ...profile, avatar: profile.avatar || fbUser.photoURL || undefined });
          setNotInvited(false);
        } else if (res.status === 404) {
          const onRegisterPage = typeof window !== 'undefined' &&
            window.location.pathname.startsWith('/register');

          if (!onRegisterPage) {
            setNotInvited(true);
            await firebaseSignOut(auth);
          }
          // On /register: do nothing — register page calls refreshProfile() after POST /api/auth/register
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    const profile = await fetchProfile(fbUser);
    if (profile) {
      setUser(profile);
      setNotInvited(false);
    }
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
    setFirebaseUser(null);
    setNotInvited(false);
  };

  const role = user?.role || null;
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'superadmin' || role === 'admin';
  const isManager = role === 'superadmin' || role === 'admin' || role === 'responsable';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isAuthenticated: !!firebaseUser,
        role,
        isSuperAdmin,
        isAdmin,
        isManager,
        notInvited,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
