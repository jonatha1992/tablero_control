'use client';

import { useAuth } from '@/hooks/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isSuperAdmin)) {
      router.replace('/dashboard');
    }
  }, [user, loading, isSuperAdmin, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) return null;

  return (
    <div className="flex flex-1 h-full min-h-0 w-full flex-col">
      <div className="flex flex-1 min-h-0 min-w-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
        />
        <div className={cn(
          'flex flex-1 flex-col transition-all duration-300 ease-in-out min-h-0 min-w-0',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'
        )}>
          <Header
            userName={user?.name}
            onMobileMenuOpen={() => setMobileSidebarOpen(true)}
          />
          <main className="flex-1 overflow-auto p-4 flex flex-col relative min-h-0 min-w-0">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
