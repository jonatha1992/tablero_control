'use client';

import { useAuth } from '@/hooks/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SuperadminSidebar } from '@/components/superadmin/superadmin-sidebar';
import { Loader2 } from 'lucide-react';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'superadmin')) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== 'superadmin') return null;

  return (
    <div className="flex h-screen">
      <SuperadminSidebar />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
