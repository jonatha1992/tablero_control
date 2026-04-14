'use client';

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

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex flex-1 flex-col lg:pl-64">
            <Header userName={user?.name} notificationCount={0} />
            <main className="flex-1 overflow-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
