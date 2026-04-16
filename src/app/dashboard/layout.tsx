'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProtectedRoute } from '@/hooks/protected-route';
import { useAuth } from '@/hooks/auth-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-1">
          <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
          <div className={cn(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "lg:pl-16" : "lg:pl-56"
          )}>
            <Header userName={user?.name} notificationCount={0} />
            <main className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
              {children}
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
