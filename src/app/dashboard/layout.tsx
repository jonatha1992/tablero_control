'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProtectedRoute } from '@/hooks/protected-route';
import { useAuth } from '@/hooks/auth-context';
import { Plus } from 'lucide-react';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { CreateTaskModal } from '@/components/tareas/create-task-modal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isCreateModalOpen, closeCreateModal, openCreateModal } = useKanbanUIStore();

  return (
    <ProtectedRoute>
      <div className="flex h-full min-h-0 w-full flex-col">
        <div className="flex flex-1 min-h-0 min-w-0">
          <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
          <div className={cn(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out min-h-0 min-w-0",
            sidebarCollapsed ? "lg:pl-16" : "lg:pl-56"
          )}>
            <Header userName={user?.name} notificationCount={0} />
            <main className="flex-1 overflow-y-auto p-4 flex flex-col relative min-h-0 min-w-0">
              {children}
            </main>
          </div>
        </div>
        <Footer />

        {/* Floating Action Button para crear tarea rápida */}
        <button
          onClick={openCreateModal}
          className="fixed bottom-10 right-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40"
          title="Agregar una tarea rápidamente"
        >
          <Plus className="h-6 w-6" />
        </button>

        <CreateTaskModal
          open={isCreateModalOpen}
          onOpenChange={(open) => { if (!open) closeCreateModal(); }}
        />
      </div>
    </ProtectedRoute>
  );
}
