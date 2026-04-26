'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/auth-context';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → redirect to login
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Role check
    if (requiredRole) {
      if (!role) {
        router.push('/');
        return;
      }

      const roleHierarchy: Record<UserRole, number> = {
        superadmin: 5,
        admin: 4,
        responsable: 3,
        miembro: 2,
        viewer: 1,
      };

      const userLevel = roleHierarchy[role];
      const requiredLevel = roleHierarchy[requiredRole];

      if (userLevel < requiredLevel) {
        router.push('/'); // Redirect to dashboard if insufficient permissions
      }
    }
  }, [isAuthenticated, loading, role, requiredRole, router, redirectTo, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — don't render children
  if (!isAuthenticated) {
    return null;
  }

  // Role check
  if (requiredRole) {
    const roleHierarchy: Record<UserRole, number> = {
      superadmin: 5,
      admin: 4,
      responsable: 3,
      miembro: 2,
      viewer: 1,
    };

    const userLevel = role ? roleHierarchy[role] : 0;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return null;
    }
  }

  return <>{children}</>;
}


