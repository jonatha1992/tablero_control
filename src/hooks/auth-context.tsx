'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { authService } from '@/services/auth.service';
import type { User, UserRole } from '@/types';

function isInviteRedirectPath(path: string | null | undefined): boolean {
  return !!path && path.startsWith('/i/');
}

interface AuthProviderProps {
  children: ReactNode;
  onSignOut?: () => void;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isOwner: boolean;
  notInvited: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchBusiness: (businessId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(fbUser: FirebaseUser): Promise<User | null> {
  const token = await fbUser.getIdToken();
  const res = await fetch('/api/auth/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    const profile = await res.json();
    return { ...profile, avatar: profile.avatar || fbUser.photoURL || undefined };
  }
  return null;
}

export function AuthProvider({ children, onSignOut }: AuthProviderProps) {
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
          // Invite pages handle user creation themselves via accept-invite API
          const redirectParam =
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('redirect')
              : null;
          const onInvitePage =
            typeof window !== 'undefined' &&
            (window.location.pathname.startsWith('/i/') || isInviteRedirectPath(redirectParam));

          if (onRegisterPage || onInvitePage) {
            // register: refreshProfile tras POST /api/auth/register
            // invite: usuario se provisiona en POST /api/invites/[token]/accept
            setUser(null);
            setNotInvited(false);
          } else {
            setUser(null);
            setNotInvited(true);
          }
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

  const switchBusiness = async (businessId: string) => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    const isDev = process.env.NODE_ENV !== 'production';
    const startedAt = isDev ? performance.now() : 0;

    const token = await fbUser.getIdToken();
    const res = await fetch('/api/users/switch-business', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId }),
    });

    if (!res.ok) {
      console.error('switchBusiness failed');
      return;
    }

    await refreshProfile();

    // Notify app-level caches/stores to drop cross-tenant data.
    window.dispatchEvent(new CustomEvent('business:switched', { detail: { businessId } }));

    // Keep behavior compatible with tests/non-Next runtimes.
    // (Avoid importing Next navigation hooks inside this provider.)
    window.location.reload();

    if (isDev) {
      const elapsedMs = performance.now() - startedAt;
      console.info(`[perf] switchBusiness total ${Math.round(elapsedMs)}ms`);
    }
  };

  const signOut = async () => {
    await authService.logout();
    onSignOut?.();
    setUser(null);
    setFirebaseUser(null);
    setNotInvited(false);
  };

  const role = user?.role || null;
  const businessRole = user?.businessRole ?? role;
  const isSuperAdmin = user?.isPlatformSuperAdmin === true || role === 'superadmin';
  const isAdmin =
    isSuperAdmin || businessRole === 'admin' || role === 'admin';
  const isManager =
    isSuperAdmin ||
    businessRole === 'admin' ||
    businessRole === 'responsable' ||
    role === 'admin' ||
    role === 'responsable';
  const isOwner = user?.isOwner ?? false;

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
        isOwner,
        notInvited,
        signOut,
        refreshProfile,
        switchBusiness,
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
